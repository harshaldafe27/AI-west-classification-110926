import base64
import csv
import io
import mimetypes
import os

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = False

headers = {
    "Authorization": f"Bearer {os.environ.get('NVIDIA_API_KEY', '')}",
    "Accept": "text/event-stream" if stream else "application/json",
}

def classify_image(image_bytes, filename):
    mime_type = mimetypes.guess_type(filename)[0] or "image/jpeg"
    image_data_url = f"data:{mime_type};base64," + base64.b64encode(image_bytes).decode("ascii")

    payload = {
      "messages": [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": "You are an expert waste classification AI agent. Analyze the attached image of waste and classify every visible item into exactly one of these categories: plastic, metal, paper, glass, organic, non-recyclable, e-waste, expired drugs, or other. Use other only when an item is clearly visible but cannot be mapped to another category. Estimate the visual volume percentage for each distinct item or material grouping; percentages must sum to exactly 100. Heavily soiled recyclable items or items contaminated with hazardous chemicals are non-recyclable. Electronics, wires, and batteries are e-waste. Pills, blister packs, and medicinal syrups are expired drugs. Respond only with valid CSV, without markdown or explanations. Quote text fields with double quotes. Do not include the percent symbol. Use exactly this header: Item_Description,Category,Visual_Volume_Percentage,Confidence_Score,Requires_Special_Handling,Reasoning"
            },
            {
              "type": "image_url",
              "image_url": {
                "url": image_data_url
              }
            }
          ]
        }
      ],
      "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
      "max_tokens": 65536,
      "reasoning_budget": 16384,
      "stream": stream,
      "temperature": 0.6,
      "top_p": 0.95
    }

    response = requests.post(invoke_url, headers=headers, json=payload, stream=stream, timeout=180)
    response.raise_for_status()
    response_json = response.json()
    content = response_json["choices"][0]["message"]["content"]
    content = content.replace("```csv", "").replace("```", "").strip()
    return list(csv.DictReader(io.StringIO(content)))


app = Flask(__name__)


@app.post("/api/classify")
def classify():
    uploaded_image = request.files.get("image")
    if uploaded_image is None or not uploaded_image.filename:
        return jsonify({"error": "Please upload an image."}), 400

    try:
        rows = classify_image(uploaded_image.read(), uploaded_image.filename)
        return jsonify({"rows": rows})
    except requests.RequestException as error:
        return jsonify({"error": f"Classification service request failed: {error}"}), 502
    except (KeyError, csv.Error, UnicodeError) as error:
        return jsonify({"error": f"The model returned an unexpected response: {error}"}), 502


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=True)