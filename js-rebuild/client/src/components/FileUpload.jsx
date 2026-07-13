import { useState, useRef } from 'react'
import { Form, Button, Alert, Card } from 'react-bootstrap'

export default function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    
    if (!file) return
    
    // Validate file type
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                          'application/vnd.ms-excel', 
                          'text/csv']
    
    if (!allowedTypes.includes(file.type)) {
      setMessage({ 
        type: 'danger', 
        text: 'Only Excel (.xlsx, .xls) and CSV files are allowed' 
      })
      return
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      setMessage({ type: 'danger', text: 'File size exceeds 50MB limit' })
      return
    }

    setSelectedFile(file)
    setMessage(null)
    
    // Show preview for Excel files
    if (['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
          'application/vnd.ms-excel'].includes(file.type)) {
      readFileAsText(file)
    }
  }

  const readFileAsText = (file) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      // For Excel files, we'd use SheetJS to parse
      setPreviewData('Excel file loaded - ready for column mapping')
    }
    
    reader.onerror = () => {
      setMessage({ type: 'danger', text: 'Error reading file' })
    }

    reader.readAsText(file)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) return
    
    try {
      // TODO: Implement actual upload to server
      console.log('Uploading file:', selectedFile.name, 'Size:', selectedFile.size)
      
      setMessage({ type: 'success', text: `File "${selectedFile.name}" uploaded successfully! Ready for import.` })
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: `Upload failed: ${error.message}` 
      })
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreviewData(null)
    setMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <Card title="Upload Excel/CSV File" />
        
        {message && (
          <Alert variant={message.type} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Form onSubmit={handleUpload}>
          <Form.Group className="mb-3">
            <Form.Label>Select File</Form.Label>
            
            <div className="border p-4 text-center rounded bg-light" style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                style={{ display: 'none' }}
              />
              
              <i className="bi bi-cloud-upload fs-1 d-block mb-2"></i>
              <p className="mb-0">Click to browse or drag & drop file here</p>
              {selectedFile && <p className="text-primary mt-2"><strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
            </div>
          </Form.Group>

          {previewData && (
            <Form.Group className="mb-3">
              <Form.Label>Preview</Form.Label>
              <Form.Text as="p" className="text-muted">
                {previewData}
              </Form.Text>
            </Form.Group>
          )}

          <div className="d-flex gap-2 mt-4">
            <Button variant="primary" type="submit" disabled={!selectedFile}>
              Upload & Continue to Mapping
            </Button>
            
            {selectedFile && (
              <Button variant="secondary" onClick={handleClear}>
                Clear Selection
              </Button>
            )}
          </div>
        </Form>

        {/* Column mapping placeholder */}
        <div className="mt-4">
          <Card title="Column Mapping" />
          <p className="text-muted text-center py-3">
            After uploading, map Excel columns to MSSQL table fields here.
          </p>
        </div>
      </div>
    </div>
  )
}
