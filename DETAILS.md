# Tech Stack and Packages Details

## Overview
This project is a waste classification application that uses a Python Flask backend to interface with the NVIDIA NIM API for image classification, and a React frontend built with Vite for the user interface.

## Backend (Python)
- **Framework**: Flask (version >=3.0,<4)
- **HTTP Client**: requests (version >=2.31,<3)
- **Purpose**: 
  - Exposes a POST endpoint `/api/classify` that accepts an image file.
  - Encodes the image to base64 and sends it to the NVIDIA NIM API (`https://integrate.api.nvidia.com/v1/chat/completions`) using the `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` model.
  - Parses the CSV response from the model and returns structured JSON.

## Frontend
- **Build Tool**: Vite (latest)
- **UI Library**: React (latest)
- **Renderer**: React DOM (latest)
- **Icons**: Lucide React (latest)
- **Plugin**: @vitejs/plugin-react (latest) for Fast Refresh and JSX transformation.

## How It Works
1. User uploads an image via the React frontend.
2. Frontend sends the image to the backend's `/api/classify` endpoint.
3. Backend processes the image, calls the NVIDIA NIM API, and returns classification results.
4. Frontend displays the results in a user-friendly format.

## Key Files
- `main.py`: Contains the Flask application and classification logic.
- `frontend/src/App.jsx`: Main React component (implied from structure).
- `frontend/index.html`: Entry point HTML.
- `requirements.txt`: Backend dependencies.
- `frontend/package.json`: Frontend dependencies.

## Notes
- The backend uses an API key for NVIDIA NIM (hardcoded in `main.py` for demonstration; should be moved to environment variables in production).
- The frontend is set up for development with Vite; production builds can be generated via `vite build`.