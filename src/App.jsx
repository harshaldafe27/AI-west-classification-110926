import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Copy, Download, FileImage, Info, Leaf, LoaderCircle, Upload, X } from 'lucide-react'
import WasteDistributionChart from './components/WasteDistributionChart'

const columns = [
  ['Item_Description', 'Item'],
  ['Category', 'Category'],
  ['Visual_Volume_Percentage', 'Volume'],
  ['Confidence_Score', 'Confidence'],
  ['Requires_Special_Handling', 'Special handling'],
  ['Reasoning', 'Reasoning'],
]

function App() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [noWasteNotice, setNoWasteNotice] = useState('')
  const [isClassifying, setIsClassifying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const inputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    return () => {
      // Clean up camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function chooseFile(event) {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return
    setFile(nextFile)
    setRows([])
    setNoWasteNotice('')
    setError('')
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    const nextFile = event.dataTransfer?.files?.[0]
    if (!nextFile) return
    setFile(nextFile)
    setRows([])
    setNoWasteNotice('')
    setError('')
  }

  function handleDragOver(event) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setIsDragging(false)
  }

  async function loadSampleImage() {
    try {
      setError('')
      setNoWasteNotice('')
      const response = await fetch('/west4.jpg')
      if (!response.ok) throw new Error('Could not load sample image.')
      const blob = await response.blob()
      const sampleFile = new File([blob], 'sample_waste.jpg', { type: 'image/jpeg' })
      setFile(sampleFile)
      setRows([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample image')
    }
  }

  function clearFile() {
    setFile(null)
    setRows([])
    setNoWasteNotice('')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
    closeCamera()
  }

  async function openCamera() {
    setCameraError('')
    setError('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or environment.')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      setIsCameraActive(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch((playErr) => {
            console.warn('Video play error:', playErr)
          })
        }
      }, 50)
    } catch (camErr) {
      const msg = camErr instanceof Error ? camErr.message : 'Unable to access camera.'
      setCameraError(msg)
      setError(`Camera error: ${msg}`)
      setIsCameraActive(false)
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setCameraError('')
  }

  function capturePhoto() {
    if (!videoRef.current) return
    const video = videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      const capturedFile = new File([blob], `camera_capture_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })
      setFile(capturedFile)
      setRows([])
      setNoWasteNotice('')
      setError('')
      closeCamera()
    }, 'image/jpeg', 0.92)
  }

  async function classifyImage() {
    if (!file) return
    setIsClassifying(true)
    setError('')
    setNoWasteNotice('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await fetch('/api/classify', { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Classification failed.')
      if (result.noWaste) {
        setNoWasteNotice(result.message || 'No waste or recyclable materials were identified in this image.')
        setRows([])
      } else {
        setRows(result.rows || [])
        setNoWasteNotice('')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsClassifying(false)
    }
  }

  function downloadCSV() {
    if (!rows || rows.length === 0) return

    const headers = columns.map(([, label]) => label)
    const keys = columns.map(([key]) => key)

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val)
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return `"${str}"`
    }

    const csvRows = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => keys.map((k) => escapeCSV(row[k] || '')).join(',')),
    ]

    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const baseName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'waste_classification'
    link.href = url
    link.setAttribute('download', `${baseName}_breakdown.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function copyToClipboard() {
    if (!rows || rows.length === 0) return

    const headers = columns.map(([, label]) => label).join('\t')
    const textRows = rows.map((row) =>
      columns.map(([key]) => row[key] || '-').join('\t')
    )
    const formattedText = [headers, ...textRows].join('\n')

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formattedText)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = formattedText
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  function getCategoryClass(category) {
    if (!category) return 'cat-other'
    const slug = category.toLowerCase().replace(/[\s_]+/g, '-')
    return `cat-${slug}`
  }

  return (
    <main id="app-shell" className="app-shell">
      <header id="app-topbar" className="topbar">
        <div className="brand"><span className="brand-mark"><Leaf size={17} /></span><span>WASTE LENS</span></div>
        <span className="status"><span className="status-dot" /> GEMINI AI CLASSIFIER / READY</span>
      </header>

      <section id="hero-intro" className="intro">
        <p className="eyebrow">VISUAL SORTING WORKSPACE</p>
        <h1>See what it is.<br /><em>Sort what comes next.</em></h1>
        <p className="lede">Upload a waste image and classify every visible material into a clean, actionable breakdown and export the details.</p>
      </section>

      <section id="workspace-container" className="workspace">
        <div id="upload-panel" className="upload-panel">
          <div className="section-label"><span>01</span> SOURCE IMAGE</div>
          {isCameraActive ? (
            <div id="camera-view-panel" className="camera-container">
              <video
                id="camera-stream-video"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video-feed"
              />
              <div className="camera-controls-overlay">
                <button
                  id="capture-photo-btn"
                  type="button"
                  className="camera-capture-btn"
                  onClick={capturePhoto}
                  title="Capture current frame"
                >
                  <Camera size={18} />
                  <span>Snap Photo</span>
                </button>
                <button
                  id="cancel-camera-btn"
                  type="button"
                  className="camera-cancel-btn"
                  onClick={closeCamera}
                  title="Cancel camera"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : !file ? (
            <>
              <div
                id="dropzone-area"
                className={`dropzone ${isDragging ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    inputRef.current?.click()
                  }
                }}
              >
                <span className="upload-icon"><Upload size={22} /></span>
                <strong>{isDragging ? 'Drop image here' : 'Choose or drop an image'}</strong>
                <span>JPG, PNG, WEBP up to 25 MB</span>

                <div className="dropzone-action-separator">
                  <span>or</span>
                </div>

                <button
                  id="take-photo-btn"
                  type="button"
                  className="take-photo-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    openCamera()
                  }}
                  title="Capture an image directly with your camera"
                >
                  <Camera size={15} />
                  <span>Take Photo</span>
                </button>
              </div>
              <div className="sample-bar">
                <span>Quick demo:</span>
                <button
                  id="sample-image-btn"
                  type="button"
                  className="sample-button"
                  onClick={loadSampleImage}
                >
                  Load sample waste image
                </button>
              </div>
            </>
          ) : (
            <div id="image-preview-wrap" className="preview-wrap">
              <img id="preview-image" src={previewUrl} alt="Selected waste" />
              <button id="clear-image-btn" className="clear-button" onClick={clearFile} type="button" aria-label="Remove selected image" title="Remove image"><X size={17} /></button>
              <div id="file-name-chip" className="file-chip"><FileImage size={15} /> {file.name}</div>
            </div>
          )}
          <input id="image-file-input" ref={inputRef} type="file" accept="image/*" onChange={chooseFile} hidden />
          <button id="classify-action-btn" className="classify-button" disabled={!file || isClassifying} onClick={classifyImage} type="button">
            {isClassifying ? <><LoaderCircle className="spin" size={18} /> Classifying...</> : <><Check size={18} /> Classify image</>}
          </button>
          {error && <p id="error-message-banner" className="error-message">{error}</p>}
        </div>

        <div id="results-panel" className="results-panel">
          <div className="results-heading">
            <div className="section-label"><span>02</span> CLASSIFICATION OUTPUT</div>
            {rows.length > 0 && (
              <div className="results-actions">
                <span id="results-count" className="row-count">{rows.length} {rows.length === 1 ? 'item' : 'items'} found</span>
                <button
                  id="download-csv-btn"
                  className="download-button"
                  onClick={downloadCSV}
                  type="button"
                  title="Download classification result as CSV"
                >
                  <Download size={13} />
                  <span>Download CSV</span>
                </button>
                <button
                  id="copy-clipboard-btn"
                  className={`download-button copy-button ${copied ? 'copied' : ''}`}
                  onClick={copyToClipboard}
                  type="button"
                  title="Copy classification data to clipboard"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            )}
          </div>
          {rows.length === 0 ? (
            noWasteNotice ? (
              <div id="no-waste-notice-box" className="no-waste-card">
                <div className="no-waste-title">
                  <Info size={16} />
                  <span>No Waste Detected</span>
                </div>
                <p className="no-waste-desc">{noWasteNotice}</p>
                <p className="no-waste-hint">Tip: Please upload or capture a photo containing discarded packaging, containers, scrap, food waste, or recyclables for material classification.</p>
              </div>
            ) : (
              <div id="results-empty-state" className="empty-state">
                <div className="empty-line" />
                <p>Your classified materials<br />will appear here.</p>
              </div>
            )
          ) : (
            <>
              <WasteDistributionChart rows={rows} />
              <div id="results-table-wrap" className="table-wrap">
                <table id="classification-table">
                <thead>
                  <tr>{columns.map(([, label]) => <th key={label}>{label}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.Item_Description}-${index}`}>
                      {columns.map(([key]) => {
                        const val = row[key] || '-'
                        if (key === 'Category') {
                          return (
                            <td key={key} data-label={key}>
                              <span className={`cat-pill ${getCategoryClass(val)}`}>{val}</span>
                            </td>
                          )
                        }
                        if (key === 'Visual_Volume_Percentage' && val !== '-') {
                          return (
                            <td key={key} data-label={key}>
                              {val.toString().endsWith('%') ? val : `${val}%`}
                            </td>
                          )
                        }
                        return <td key={key} data-label={key}>{val}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        </div>
      </section>

      <footer><span>WASTE LENS</span><span>Powered by Google Gemini Flash Vision</span></footer>
    </main>
  )
}

export default App
