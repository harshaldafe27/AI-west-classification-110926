import { useEffect, useRef, useState } from 'react'
import { Check, FileImage, Leaf, LoaderCircle, Upload, X } from 'lucide-react'

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
  const [isClassifying, setIsClassifying] = useState(false)
  const inputRef = useRef(null)

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
    setError('')
  }

  function clearFile() {
    setFile(null)
    setRows([])
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function classifyImage() {
    if (!file) return
    setIsClassifying(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await fetch('/api/classify', { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Classification failed.')
      setRows(result.rows || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsClassifying(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Leaf size={17} /></span><span>WASTE LENS</span></div>
        <span className="status"><span className="status-dot" /> AI CLASSIFIER / READY</span>
      </header>

      <section className="intro">
        <p className="eyebrow">VISUAL SORTING WORKSPACE</p>
        <h1>See what it is.<br /><em>Sort what comes next.</em></h1>
        <p className="lede">Upload a waste image and let the classifier map every visible material into a clean, actionable breakdown.</p>
      </section>

      <section className="workspace">
        <div className="upload-panel">
          <div className="section-label"><span>01</span> SOURCE IMAGE</div>
          {!file ? (
            <button className="dropzone" onClick={() => inputRef.current?.click()} type="button">
              <span className="upload-icon"><Upload size={22} /></span>
              <strong>Choose an image</strong>
              <span>JPG, PNG, WEBP up to 20 MB</span>
            </button>
          ) : (
            <div className="preview-wrap">
              <img src={previewUrl} alt="Selected waste" />
              <button className="clear-button" onClick={clearFile} type="button" aria-label="Remove selected image" title="Remove image"><X size={17} /></button>
              <div className="file-chip"><FileImage size={15} /> {file.name}</div>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" onChange={chooseFile} hidden />
          <button className="classify-button" disabled={!file || isClassifying} onClick={classifyImage} type="button">
            {isClassifying ? <><LoaderCircle className="spin" size={18} /> Classifying...</> : <><Check size={18} /> Classify image</>}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="results-panel">
          <div className="results-heading">
            <div className="section-label"><span>02</span> CLASSIFICATION OUTPUT</div>
            {rows.length > 0 && <span className="row-count">{rows.length} {rows.length === 1 ? 'item' : 'items'} found</span>}
          </div>
          {rows.length === 0 ? (
            <div className="empty-state"><div className="empty-line" /><p>Your classified materials<br />will appear here.</p></div>
          ) : (
            <div className="table-wrap"><table><thead><tr>{columns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.Item_Description}-${index}`}>{columns.map(([key]) => <td key={key} data-label={key}>{row[key] || '-'}</td>)}</tr>)}</tbody></table></div>
          )}
        </div>
      </section>

      <footer><span>WASTE LENS</span><span>Powered by visual intelligence</span></footer>
    </main>
  )
}

export default App
