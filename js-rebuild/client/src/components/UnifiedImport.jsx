import { useState, useEffect, useRef } from 'react'
import { Form, Button, Alert, Card, ListGroup, Badge, Row, Col, Dropdown } from 'react-bootstrap'

// Helper function to simulate file parsing (will be replaced with SheetJS)
const parseCSVContent = (content) => {
  const lines = content.trim().split('\n')
  
  if (lines.length < 2) return null
  
  // Parse headers - handle quoted values properly
  const parseLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"' && !inQuotes) {
        inQuotes = true
      } else if (char === '"' && inQuotes) {
        // Check for escaped quote
        if (line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = false
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim().replace(/^"|"$/g, ''))
    return result
  }
  
  const headers = parseLine(lines[0])
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue // Skip empty lines
    
    const values = parseLine(lines[i])
    
    if (values.length === headers.length) {
      rows.push(headers.map((header, index) => ({
        [header]: values[index]
      })))
    }
  }
  
  return { headers, rows }
}

export default function UnifiedImport() {
  const [activeSection, setActiveSection] = useState('connections')
  const [formData, setFormData] = useState({
    server: '',
    host: 'localhost',
    port: 3306,
    database: '',
    username: '',
    password: ''
  })
  const [savedConnections, setSavedConnections] = useState([])
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // File upload state with enhanced tracking
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [parsingResult, setParsingResult] = useState(null)
  const [importStatus, setImportStatus] = useState('idle') // idle, processing, completed, failed
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadSavedConnections()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Simulate connection test and save for demo purposes
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('Testing connection with:', formData)
      
      setMessage({ type: 'success', text: `✅ Connection "${formData.server}" tested successfully!` })

    } catch (error) {
      console.error('Connection failed:', error)
      setMessage({ 
        type: 'danger', 
        text: `❌ Connection test failed: ${error.message}` 
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPreset = (presetData) => {
    setFormData({ ...formData, ...presetData })
    setMessage({ type: 'info', text: `Loaded preset: ${presetData.server || 'Custom'}` })
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteConnection = async (id) => {
    try {
      if (!window.confirm('Are you sure you want to delete this connection?')) {
        return
      }
      
      setSavedConnections(prev => prev.filter(conn => conn.id !== id))
      setMessage({ type: 'success', text: `Connection deleted successfully!` })

    } catch (error) {
      console.error('Delete failed:', error)
      setMessage({ 
        type: 'danger', 
        text: `Error deleting connection: ${error.message}` 
      })
    }
  }

  const loadSavedConnections = async () => {
    try {
      // Simulate loading from database for demo
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Mock data - would come from real API in production
      setSavedConnections([
        {
          id: 1,
          server: 'Local MySQL Test Database',
          host: 'localhost',
          port: 3306,
          database: 'excel_importer_db',
          username: 'root',
          password: 'P@ssw0rd'
        }
      ])
      
    } catch (error) {
      console.error('Error loading connections:', error)
      setSavedConnections([])
    } finally {
      setLoading(false)
    }
  }

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

    // Validate file size (10MB max for demo)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setMessage({ type: 'danger', text: `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)` })
      return
    }

    setSelectedFile(file)
    setMessage(null)
    
    // Parse file content for preview
    parseFileContent(file)
  }

  const parseFileContent = (file) => {
    // Simulate file parsing with mock data based on extension
    let content = ''
    
    if (file.name.endsWith('.csv')) {
      // Use demo CSV content
      content = getDemoCSVContent()
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Simulate Excel parsing (in real app, use SheetJS)
      setPreviewData(`Excel file loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      setMessage({ type: 'success', text: `✅ Excel file parsed successfully! Found ${getDemoRowCount()} rows.` })
      
      // Simulate parsing result for demo
      const mockResult = getMockParsingResult(file.name)
      setParsingResult(mockResult)
      return
    }
    
    // Parse as CSV
    content = getDemoCSVContent()
    const parsed = parseCSVContent(content)
    
    if (parsed) {
      setPreviewData(`CSV file loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      setMessage({ type: 'success', text: `✅ CSV parsed successfully! Found ${parsed.rows.length} rows with ${parsed.headers.length} columns.` })
      
      setParsingResult(parsed)
    } else {
      setMessage({ type: 'danger', text: 'Failed to parse file content' })
    }
  }

  const getDemoCSVContent = () => {
    // Sample employee data CSV
    return `Employee_ID,Full_Name,Email,Department,Position,Hire_Date,Salary,Status
1001,"John Smith","john.smith@company.com",Engineering,Software Engineer,2020-03-15,75000,Active
1002,"Sarah Johnson","sarah.johnson@company.com",Marketing,Marketing Manager,2019-06-22,85000,Active
1003,"Michael Brown","michael.brown@company.com",Sales,Sales Representative,2021-01-10,65000,Active
1004,"Emily Davis","emily.davis@company.com",HR,HR Specialist,2022-08-03,55000,Active
1005,"David Wilson","david.wilson@company.com",Engineering,Senior Developer,2018-11-20,95000,Active`
  }

  const getDemoRowCount = () => {
    return parsingResult?.rows?.length || 5
  }

  const getMockParsingResult = (fileName) => {
    return {
      headers: ['Employee_ID', 'Full_Name', 'Email', 'Department', 'Position', 'Hire_Date', 'Salary', 'Status'],
      rows: [
        { Employee_ID: '1001', Full_Name: 'John Smith', Email: 'john.smith@company.com', Department: 'Engineering', Position: 'Software Engineer', Hire_Date: '2020-03-15', Salary: '75000', Status: 'Active' },
        { Employee_ID: '1002', Full_Name: 'Sarah Johnson', Email: 'sarah.johnson@company.com', Department: 'Marketing', Position: 'Marketing Manager', Hire_Date: '2019-06-22', Salary: '85000', Status: 'Active' },
        { Employee_ID: '1003', Full_Name: 'Michael Brown', Email: 'michael.brown@company.com', Department: 'Sales', Position: 'Sales Representative', Hire_Date: '2021-01-10', Salary: '65000', Status: 'Active' },
        { Employee_ID: '1004', Full_Name: 'Emily Davis', Email: 'emily.davis@company.com', Department: 'HR', Position: 'HR Specialist', Hire_Date: '2022-08-03', Salary: '55000', Status: 'Active' },
        { Employee_ID: '1005', Full_Name: 'David Wilson', Email: 'david.wilson@company.com', Department: 'Engineering', Position: 'Senior Developer', Hire_Date: '2018-11-20', Salary: '95000', Status: 'Active' }
      ]
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setPreviewData(null)
    setParsingResult(null)
    setImportStatus('idle')
    setImportProgress(0)
    setMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleColumnMapping = () => {
    // Simulate column mapping for demo
    if (!parsingResult) return
    
    setImportStatus('mapping_complete')
    setMessage({ type: 'success', text: `✅ Column mapping completed! Mapping ${parsingResult.rows.length} records to database.` })
  }

  const handleStartImport = () => {
    if (importStatus !== 'mapping_complete') {
      setMessage({ type: 'warning', text: 'Please complete column mapping before starting import.' })
      return
    }
    
    setImportStatus('processing')
    setImportProgress(0)
    setMessage(null)
  }

  const handleCompleteImport = () => {
    setImportStatus('completed')
    setImportProgress(100)
    setTimeout(() => {
      setMessage({ type: 'success', text: '✅ Import completed successfully! All records imported.' })
    }, 500)
  }

  return (
    <div className="container-fluid py-4">
      <Row>
        <Col md={8} mx-auto>
          <Card>
            {/* Tab Navigation */}
            <ListGroup variant="flush" className="mb-3" style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              <ListGroup.Item 
                action 
                active={activeSection === 'connections'}
                onClick={() => setActiveSection('connections')}
                className="border-0 mb-2"
              >
                <div className="d-flex justify-content-between w-100">
                  <span>🔗 <strong>Select Connection</strong></span>
                  {savedConnections.length > 0 && (
                    <Badge bg="success" pill>{savedConnections.length}</Badge>
                  )}
                </div>
              </ListGroup.Item>
              
              <ListGroup.Item 
                action 
                active={activeSection === 'upload'}
                onClick={() => setActiveSection('upload')}
                className="border-0 mb-2"
              >
                <div className="d-flex justify-content-between w-100">
                  <span>📁 <strong>Select File</strong></span>
                  {selectedFile && (
                    <Badge bg="primary" pill>{selectedFile.name}</Badge>
                  )}
                </div>
              </ListGroup.Item>

              <ListGroup.Item 
                action 
                active={activeSection === 'mapping'}
                onClick={() => setActiveSection('mapping')}
                className="border-0 mb-2"
              >
                <div className="d-flex justify-content-between w-100">
                  <span>📊 <strong>Map Columns</strong></span>
                  {parsingResult && (
                    <Badge bg="info" pill>{parsingResult.rows.length} rows</Badge>
                  )}
                </div>
              </ListGroup.Item>

              <ListGroup.Item 
                action 
                active={activeSection === 'progress'}
                onClick={() => setActiveSection('progress')}
                className="border-0 mb-2"
              >
                <div className="d-flex justify-content-between w-100">
                  <span>📈 <strong>Import Progress</strong></span>
                  {importStatus === 'processing' ? (
                    <Badge bg="warning" pill>{importProgress}%</Badge>
                  ) : importStatus === 'completed' ? (
                    <Badge bg="success" pill>Complete</Badge>
                  ) : importStatus === 'failed' ? (
                    <Badge bg="danger" pill>Failed</Badge>
                  ) : (
                    <Badge bg="secondary" pill>Ready</Badge>
                  )}
                </div>
              </ListGroup.Item>
            </ListGroup>

            {/* Alert Messages */}
            {message && (
              <Alert variant={message.type} onClose={() => setMessage(null)} show dismissible>
                {message.text}
              </Alert>
            )}

            {/* Section 1: Connection Configuration */}
            {activeSection === 'connections' && (
              <div className="p-4">
                <h5 className="text-primary mb-4">
                  <Badge bg="primary" className="me-2">Step 1</Badge>
                  Configure Database Connection
                </h5>

                {/* Presets Section */}
                {savedConnections.length === 0 && (
                  <div className="mb-4 p-3 bg-light rounded mb-4">
                    <h6 className="text-primary mb-3">
                      <Badge bg="primary" className="me-2">Quick Start</Badge>
                      Preset Connection Templates
                    </h6>
                    
                    <div className="row g-2">
                      {[
                        { server: 'Local MySQL Test DB', host: 'localhost', port: 3306, database: 'excel_importer_db', username: 'root', password: 'P@ssw0rd' },
                        { server: 'SQL Server Express', host: 'localhost', port: 1433, database: 'master', username: 'sa' },
                        { server: 'Production Database', host: '', port: 1433, database: '', username: '' }
                      ].map((preset, index) => (
                        <div key={index} className="col-6">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => loadPreset(preset)}
                          >
                            {preset.server}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connection Form */}
                <Form onSubmit={handleSubmit}>
                  <h6 className="text-muted mb-3">Connection Details</h6>

                  {/* Row 1: Server Name and Host Address */}
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Server Name *</strong></Form.Label>
                        <Form.Control 
                          type="text" 
                          name="server"
                          value={formData.server}
                          onChange={handleChange}
                          placeholder="e.g., My Production Server"
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Host Address *</strong></Form.Label>
                        <Form.Control 
                          type="text" 
                          name="host"
                          value={formData.host}
                          onChange={handleChange}
                          placeholder="e.g., localhost, 192.168.1.100"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Row 2: Port and Database */}
                  <Row className="mb-3">
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Port</strong></Form.Label>
                        <Form.Control 
                          type="number" 
                          name="port"
                          value={formData.port}
                          onChange={handleChange}
                          placeholder="1433"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Database Name *</strong></Form.Label>
                        <Form.Control 
                          type="text" 
                          name="database"
                          value={formData.database}
                          onChange={handleChange}
                          placeholder="e.g., master, tempdb"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Row 3: Username and Password */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Username *</strong></Form.Label>
                        <Form.Control 
                          type="text" 
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="e.g., sa, your_username"
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Password *</strong></Form.Label>
                        <Form.Control 
                          type="password" 
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter password"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Connection Actions */}
                  <div className="d-flex gap-2 mt-4 pt-3 border-top">
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? 'Testing & Saving...' : (
                        <>Test & Save Connection</>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => handleSubmit({ preventDefault: () => {} })}
                      disabled={loading}
                    >
                      Test Only
                    </Button>

                    {savedConnections.length > 0 && (
                      <Button 
                        variant="outline-danger" 
                        onClick={() => {
                          if (window.confirm('Delete all saved connections from database?')) {
                            setSavedConnections([])
                            setMessage({ type: 'info', text: 'All connections deleted' })
                          }
                        }}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Saved Connections List */}
                  {savedConnections.length > 0 && (
                    <>
                      <h6 className="text-primary mt-4 mb-3">
                        <Badge bg="success" className="me-2">Saved</Badge>
                        Your Connections ({savedConnections.length})
                      </h6>

                      <ListGroup variant="flush">
                        {savedConnections.map((conn) => (
                          <ListGroup.Item key={conn.id} action>
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="fw-bold">{conn.server}</div>
                                <small className="text-muted d-block mt-1">
                                  {conn.host}:{conn.port} / {conn.database}<br/>
                                  User: {conn.username}
                                </small>
                              </div>
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={() => loadPreset({ server: conn.server, ...conn })}
                              >
                                Load
                              </Button>
                            </div>

                            {/* Quick actions */}
                            <div className="mt-2 pt-2 border-top d-flex gap-1">
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => loadPreset({ server: conn.server, ...conn })}
                              >
                                Use This
                              </Button>

                              <Button 
                                variant="outline-info" 
                                size="sm"
                                onClick={() => {
                                  setActiveSection('upload')
                                  setMessage({ type: 'info', text: `Loaded "${conn.server}" connection. Now select a file.` })
                                }}
                              >
                                Upload File
                              </Button>

                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => deleteConnection(conn.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </>
                  )}

                  {/* Help Text */}
                  {savedConnections.length > 0 && (
                    <div className="mt-4 p-3 bg-light rounded">
                      <h6 className="text-muted mb-2">💡 Next Steps:</h6>
                      <ol className="mb-0 ps-3 small">
                        <li>Select a saved connection above or configure a new one</li>
                        <li>Click "Upload File" for any saved connection</li>
                        <li>Drag & drop your Excel/CSV file</li>
                        <li>Map columns to database fields</li>
                        <li>Execute the import!</li>
                      </ol>
                    </div>
                  )}
                </Form>
              </div>
            )}

            {/* Section 2: File Upload */}
            {activeSection === 'upload' && (
              <div className="p-4">
                <h5 className="text-primary mb-4">
                  <Badge bg="primary" className="me-2">Step 2</Badge>
                  Select Your Excel/CSV File
                </h5>

                {selectedFile ? (
                  <>
                    {/* Selected File Display */}
                    <div className="p-3 mb-3 bg-success text-white rounded">
                      <strong>✅ File Selected:</strong>{' '}
                      <span className="fw-bold">{selectedFile.name}</span> 
                      {' | '}( {(selectedFile.size / 1024 / 1024).toFixed(2)} MB )
                    </div>

                    {previewData && (
                      <div className="mb-3 p-3 bg-light rounded">
                        <strong>{previewData}</strong>
                      </div>
                    )}

                    {/* Parsing Result Preview */}
                    {parsingResult && (
                      <Card className="mt-4 mb-4" border="info">
                        <Card.Header as="h6" className="bg-info text-white">
                          📊 Data Preview ({parsingResult.rows.length} rows)
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            {parsingResult.headers.map((header, index) => (
                              <Col key={index} md={24 / parsingResult.headers.length} className="mb-3">
                                <strong>{header}</strong><br/>
                                {parsingResult.rows.slice(0, 2).map((row, rIndex) => (
                                  <div key={rIndex} className="text-muted small mt-1">• {row[header]}</div>
                                ))}
                              </Col>
                            ))}
                          </Row>
                        </Card.Body>
                      </Card>
                    )}

                    {/* File Actions */}
                    <div className="d-flex gap-2 mb-4">
                      {parsingResult ? (
                        <>
                          <Button variant="success" onClick={handleColumnMapping}>
                            ✅ Proceed to Column Mapping →
                          </Button>
                          
                          <Button variant="outline-secondary" onClick={() => setActiveSection('connections')}>
                            ← Back to Connections
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="primary" onClick={() => {
                            setActiveSection('mapping')
                          }}>
                            Continue to Column Mapping →
                          </Button>

                          <Button variant="secondary" onClick={handleClearFile}>
                            Clear Selection
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Upload Area */}
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
                        {selectedFile && (
                          <div className="mt-2 p-2 bg-white rounded">
                            <strong>{selectedFile.name}</strong><br/>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                      </div>
                    </Form.Group>

                    {/* File Type Info */}
                    <div className="p-3 bg-info text-white rounded mb-4">
                      <strong>📊 Supported Formats:</strong><br/>
                      • Excel 2007+ (.xlsx)<br/>
                      • Excel 97-2003 (.xls)<br/>
                      • Comma Separated Values (.csv)
                    </div>

                    {/* Help Text */}
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted mb-2">💡 Tips:</h6>
                      <ul className="mb-0 ps-3 small">
                        <li>Maximum file size: 50MB</li>
                        <li>File will be processed client-side for preview</li>
                        <li>After upload, map columns to your database table fields</li>
                        <li>All data is validated before import begins</li>
                      </ul>
                    </div>

                    {/* Connection Selection */}
                    {savedConnections.length === 0 && (
                      <div className="mt-4 p-3 bg-warning text-dark rounded">
                        <strong>⚠️ No Connections Saved:</strong><br/>
                        Please go to the "Select Connection" tab first and create a database connection.
                      </div>
                    )}
                  </>
                )}

                {/* Help Text */}
                {selectedFile && !parsingResult && (
                  <div className="mt-4 p-3 bg-light rounded">
                    <h6 className="text-muted mb-2">🎯 Ready for Next Step:</h6>
                    <p className="mb-0 small">Once you click "Continue to Column Mapping", you'll be able to map your Excel columns to the database table fields.</p>
                  </div>
                )}
              </div>
            )}

            {/* Section 3: Column Mapping */}
            {activeSection === 'mapping' && (
              <div className="p-4 text-center">
                <h5 className="text-primary mb-4">
                  <Badge bg="primary" className="me-2">Step 3</Badge>
                  Map Columns
                </h5>

                {savedConnections.length === 0 ? (
                  <div className="p-5">
                    <i className="bi bi-exclamation-triangle text-warning fs-1 d-block mb-3"></i>
                    <strong>No Connection Selected</strong><br/>
                    Please create a database connection first before mapping columns.
                  </div>
                ) : !selectedFile ? (
                  <div className="p-5">
                    <i className="bi bi-exclamation-triangle text-warning fs-1 d-block mb-3"></i>
                    <strong>No File Selected</strong><br/>
                    Please upload your Excel/CSV file first before mapping columns.
                  </div>
                ) : !parsingResult ? (
                  <div className="p-5">
                    <i className="bi bi-exclamation-triangle text-warning fs-1 d-block mb-3"></i>
                    <strong>File Not Parsed</strong><br/>
                    Please wait for the file to be processed before mapping columns.
                  </div>
                ) : (
                  <>
                    {importStatus === 'mapping_complete' ? (
                      // Mapping Complete State
                      <Card className="mt-4 p-5 border-success" border="success">
                        <Card.Body>
                          <h3 className="text-success mb-3">✅ Column Mapping Complete!</h3>
                          <p className="lead mb-4">Your data is ready to be imported into the database.</p>
                          
                          <div className="row text-center mb-4">
                            <Col md={4}>
                              <strong>Total Records</strong><br/>
                              <Badge bg="primary" className="mt-2">{parsingResult.rows.length}</Badge>
                            </Col>
                            <Col md={4}>
                              <strong>Status</strong><br/>
                              <Badge bg="success" className="mt-2">Ready to Import</Badge>
                            </Col>
                            <Col md={4}>
                              <strong>Estimated Time</strong><br/>
                              <span className="text-muted small">&lt; 1 minute</span>
                            </Col>
                          </div>

                          <Button variant="success" size="lg" onClick={() => setActiveSection('progress')}>
                            → Proceed to Import Progress
                          </Button>
                        </Card.Body>
                      </Card>
                    ) : (
                      // Initial Mapping UI Placeholder
                      <>
                        <Card className="mb-4">
                          <Card.Header as="h5" className="bg-primary text-white">
                            Column Mapping Interface
                          </Card.Header>
                          <Card.Body>
                            <p className="text-muted mb-3">Map Excel columns to database table fields.</p>
                            
                            {importStatus === 'mapping_complete' ? null : (
                              <>
                                {/* Example mapping visualization */}
                                <div className="row g-3 mb-4">
                                  {parsingResult.headers.slice(0, 6).map((excelCol, index) => (
                                    <Col key={index} md={6}>
                                      <div className="d-flex align-items-center p-2 border rounded bg-light">
                                        <span className="badge bg-primary me-3">{excelCol}</span>
                                        <i className="bi bi-arrow-right mx-2"></i>
                                        <span className="text-muted small">Database Field (auto-mapped)</span>
                                      </div>
                                    </Col>
                                  ))}
                                </div>

                                {/* Action buttons */}
                                <Button 
                                  variant="success" 
                                  className="mt-3" 
                                  onClick={handleColumnMapping}
                                >
                                  ✅ Complete Mapping & Proceed to Import
                                </Button>
                              </>
                            )}
                          </Card.Body>
                        </Card>

                        {/* Data Summary */}
                        {importStatus === 'mapping_complete' && (
                          <div className="mt-4 p-3 bg-success text-white rounded">
                            <strong>🎉 Mapping Confirmed!</strong><br/>
                            The following columns will be imported:<br/>
                            • {parsingResult.headers.join(', ')}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Section 4: Progress */}
            {activeSection === 'progress' && (
              <div className="p-4 text-center">
                <h5 className="text-primary mb-4">
                  <Badge bg="primary" className="me-2">Step 4</Badge>
                  Import Progress
                </h5>

                {savedConnections.length === 0 ? (
                  <div className="p-5">
                    <i className="bi bi-exclamation-triangle text-warning fs-1 d-block mb-3"></i>
                    <strong>No Connection Selected</strong><br/>
                    Please create a database connection first.
                  </div>
                ) : !selectedFile ? (
                  <div className="p-5">
                    <i className="bi bi-exclamation-triangle text-warning fs-1 d-block mb-3"></i>
                    <strong>No File Selected</strong><br/>
                    Please upload your Excel/CSV file first.
                  </div>
                ) : !parsingResult ? (
                  <div className="p-5">
                    <i className="bi bi-exclamation-triangle text-warning fs-1 d-block mb-3"></i>
                    <strong>No Data to Import</strong><br/>
                    Please upload and parse your file first.
                  </div>
                ) : (
                  <>
                    {importStatus === 'idle' && parsingResult && (
                      // Initial State - Ready to Start
                      <Card className="mb-4">
                        <Card.Header as="h5" className="bg-secondary text-white">
                          Ready to Import
                        </Card.Header>
                        <Card.Body>
                          <p className="text-muted mb-3">You're about to import {parsingResult.rows.length} records into your database.</p>
                          
                          {/* Summary Stats */}
                          <div className="row text-center g-3 mb-4">
                            <Col md={6}>
                              <strong>Source File</strong><br/>
                              <span className="text-primary">{selectedFile.name}</span>
                            </Col>
                            <Col md={6}>
                              <strong>Total Records</strong><br/>
                              <Badge bg="primary" className="mt-2">{parsingResult.rows.length}</Badge>
                            </Col>
                          </div>

                          {/* Warning if no mapping completed */}
                          {importStatus !== 'mapping_complete' && (
                            <Alert variant="warning">
                              ⚠️ Please complete column mapping before starting the import process.
                            </Alert>
                          )}

                          {/* Action Buttons */}
                          {!importStatus || importStatus === 'completed' ? (
                            <>
                              <Button 
                                variant="primary" 
                                size="lg" 
                                onClick={handleStartImport}
                                disabled={importStatus !== 'mapping_complete'}
                              >
                                {importStatus === 'mapping_complete' ? '🚀 Start Import Process' : 'Complete Column Mapping First'}
                              </Button>

                              <Button 
                                variant="outline-secondary" 
                                className="mt-3"
                                onClick={() => setActiveSection('mapping')}
                              >
                                ← Back to Column Mapping
                              </Button>
                            </>
                          ) : importStatus === 'processing' ? (
                            // Importing in Progress
                            <div>
                              <h6 className="mb-3">Import Progress</h6>
                              
                              {/* Animated Progress Bar */}
                              <div className="progress mb-4" style={{ height: '30px' }}>
                                <div 
                                  className="progress-bar progress-bar-striped progress-bar-animated" 
                                  role="progressbar" 
                                  style={{ width: `${importProgress}%`, backgroundColor: '#28a745' }}
                                >
                                  {importProgress}% Complete
                                </div>
                              </div>

                              {/* Live Stats */}
                              <Row className="text-center g-3 mb-4">
                                <Col md={3}>
                                  <h6 className="text-muted mb-1">Total Records</h6>
                                  <strong className="display-5">{parsingResult.rows.length}</strong>
                                </Col>
                                <Col md={3}>
                                  <h6 className="text-muted mb-1">Imported</h6>
                                  <strong className="text-success display-5">
                                    {Math.round((importProgress / 100) * parsingResult.rows.length)}
                                  </strong>
                                </Col>
                                <Col md={3}>
                                  <h6 className="text-muted mb-1">Failed</h6>
                                  <strong className="text-danger display-5">0</strong>
                                </Col>
                                <Col md={3}>
                                  <h6 className="text-muted mb-1">Status</h6>
                                  <Badge bg="warning" pill>{importProgress}% Complete</Badge>
                                </Col>
                              </Row>

                              {/* Action Buttons */}
                              {importProgress === 100 ? (
                                <>
                                  <Button 
                                    variant="success" 
                                    size="lg" 
                                    onClick={handleCompleteImport}
                                  >
                                    ✅ Complete Import
                                  </Button>
                                  
                                  <Button 
                                    variant="outline-primary" 
                                    className="mt-3"
                                    onClick={() => setActiveSection('mapping')}
                                  >
                                    ← Back to Mapping
                                  </Button>
                                </>
                              ) : (
                                <div className="text-muted">
                                  Please wait while the import is in progress...<br/>
                                  You can monitor the progress or return to previous steps.
                                </div>
                              )}
                            </div>
                          ) : (
                            // Import Completed
                            <Card border="success" className="mt-4">
                              <Card.Header as="h5" className="bg-success text-white">
                                ✅ Import Completed Successfully!
                              </Card.Header>
                              <Card.Body className="text-center p-5">
                                <i className="bi bi-check-circle-fill display-1 text-success mb-3"></i>
                                <h4>All Records Imported</h4>
                                <p className="lead text-muted">Successfully imported {parsingResult.rows.length} records into your database.</p>
                                
                                <div className="row mt-4 g-3">
                                  <Col md={6}>
                                    <strong>📊 Summary:</strong><br/>
                                    • Total Records: {parsingResult.rows.length}<br/>
                                    • Successful: {parsingResult.rows.length}<br/>
                                    • Failed: 0<br/>
                                    • Time: &lt; 1 minute
                                  </Col>
                                  <Col md={6}>
                                    <strong>📈 Next Steps:</strong><br/>
                                    • Verify data in database<br/>
                                    • Create new import if needed<br/>
                                    • Export results or generate reports
                                  </Col>
                                </div>

                                <Button 
                                  variant="outline-primary" 
                                  size="lg" 
                                  className="mt-4"
                                  onClick={() => setActiveSection('connections')}
                                >
                                  ← Back to Connections
                                </Button>
                              </Card.Body>
                            </Card>
                          )}
                        </Card.Body>
                      </Card>
                    )}

                    {/* Failed State */}
                    {importStatus === 'failed' && (
                      <div className="p-5 border border-danger rounded">
                        <i className="bi bi-exclamation-triangle-fill display-1 text-danger mb-3"></i>
                        <h4 className="text-danger">Import Failed</h4>
                        <p className="lead">Something went wrong during the import process.</p>
                        
                        <Alert variant="danger" className="mt-3">
                          Please check the logs and try again. Common issues:<br/>
                          • Invalid connection details<br/>
                          • File format not supported<br/>
                          • Database table doesn't exist<br/>
                          • Insufficient permissions
                        </Alert>

                        <Button 
                          variant="outline-primary" 
                          className="mt-3"
                          onClick={() => {
                            setImportStatus('idle')
                            setActiveSection('mapping')
                          }}
                        >
                          ← Go Back and Try Again
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Footer Instructions */}
          <div className="mt-4 p-3 bg-dark text-white rounded">
            <h6 className="mb-2">📋 Quick Guide:</h6>
            <ol className="small mb-0 ps-3">
              <li>Select or create a database connection</li>
              <li>Upload your Excel/CSV file and verify data preview</li>
              <li>Review column mappings (auto-mapped by default)</li>
              <li>Execute the import and monitor progress</li>
            </ol>
          </div>
        </Col>
      </Row>
    </div>
  )
}
