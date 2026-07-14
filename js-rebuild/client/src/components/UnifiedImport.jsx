import { useState, useEffect, useRef } from 'react'
import { Form, Button, Alert, Card, ListGroup, Badge, Row, Col, Dropdown, Spinner } from 'react-bootstrap'
import * as XLSX from 'xlsx'
import * as api from '../services/api'

export default function UnifiedImport() {
    // ========== STATE MANAGEMENT ==========
    
    const [activeSection, setActiveSection] = useState('connections')
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState(null)
    
    // Connection State
    const [formData, setFormData] = useState({
        server: '',
        host: 'localhost',
        port: 3306,
        database: '',
        username: '',
        password: ''
    })
    const [savedConnections, setSavedConnections] = useState([])
    
    // File Upload State
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewData, setPreviewData] = useState(null)
    const [parsingResult, setParsingResult] = useState(null)
    const [importStatus, setImportStatus] = useState('idle') // idle, processing, completed, failed
    const [importProgress, setImportProgress] = useState(0)
    
    // Import State
    const [currentImportId, setCurrentImportId] = useState(null)
    const [mappings, setMappings] = useState({})
    const [uploadingFile, setUploadingFile] = useState(false)
    const fileInputRef = useRef(null)

    // Load saved connections on mount
    useEffect(() => {
        loadSavedConnections()
    }, [])

    // ========== CONNECTION HANDLERS ==========

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        try {
            // Test connection first
            await api.testConnection(
                formData.host,
                formData.port || 3306,
                formData.database,
                formData.username,
                formData.password || ''
            )
            
            // Save connection
            const saved = await api.saveConnection({
                server: formData.server,
                host: formData.host,
                port: parseInt(formData.port) || 3306,
                database: formData.database,
                username: formData.username,
                password: formData.password || '',
                trusted_connection: false
            })
            
            setSavedConnections(prev => [...prev, saved])
            setMessage({ type: 'success', text: `✅ Connection "${formData.server}" saved successfully!` })
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
            if (!window.confirm('Are you sure you want to delete this connection?')) return
            
            await api.deleteConnection(id)
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
            setLoading(true)
            const connections = await api.getConnections()
            setSavedConnections(connections)
            
            // Load test preset if no connections exist
            if (connections.length === 0 && activeSection === 'connections') {
                loadPreset({ server: 'Test Local MySQL', host: 'localhost', port: 3306, database: 'excel_importer_db', username: 'root' })
            }
        } catch (error) {
            console.error('Error loading connections:', error)
            setMessage({ type: 'warning', text: `Could not load connections from server. Using mock data.` })
            setSavedConnections([
                { id: 1, server: 'Test Local MySQL', host: 'localhost', port: 3306, database: 'excel_importer_db', username: 'root' }
            ])
        } finally {
            setLoading(false)
        }
    }

    // ========== FILE UPLOAD HANDLERS ==========

    const handleFileSelect = async (event) => {
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
            setMessage({ type: 'danger', text: `File size exceeds ${maxSize / 1024 / 1024}MB limit` })
            return
        }

        setSelectedFile(file)
        setApiError(null)
        setUploadingFile(true)
        setMessage(null)
        
        // Parse file for preview (client-side with SheetJS)
        await parseAndUploadFile(file)
    }

    const parseAndUploadFile = async (file) => {
        try {
            // Parse file client-side first for preview
            const arrayBuffer = await file.arrayBuffer()
            const workbook = XLSX.read(arrayBuffer)
            
            // Get first sheet data
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            
            if (jsonData.length === 0) throw new Error('File is empty')
            
            // Extract headers from first row
            const headers = jsonData[0] || []
            const dataRows = jsonData.slice(1)
            
            // Convert to object format for preview
            const rows = []
            if (headers.length > 0 && dataRows.length > 0) {
                const headerKeys = headers.map(h => String(h).trim())
                dataRows.forEach(row => {
                    const rowObj = {}
                    headerKeys.forEach((header, idx) => {
                        rowObj[header] = row[idx] !== undefined ? row[idx] : ''
                    })
                    rows.push(rowObj)
                })
            }
            
            setPreviewData(`File loaded: ${file.name} (${api.formatFileSize(file.size)})`)
            setParsingResult({ headers, rows, raw_data: jsonData })
            setMessage({ type: 'success', text: `✅ File parsed successfully! ${dataRows.length} rows with ${headers.length} columns.` })
            
        } catch (error) {
            console.error('File parsing error:', error)
            throw new Error(`Failed to parse file: ${error.message}`)
        } finally {
            setUploadingFile(false)
        }
    }

    const uploadToFileServer = async () => {
        if (!selectedFile || !currentImportId) return
        
        try {
            setMessage({ type: 'info', text: 'Uploading file to server...' })
            
            // Upload file to backend
            const result = await api.uploadFile(selectedFile, currentImportId)
            
            if (result.success) {
                setCurrentImportId(result.data.file_id)
                setParsingResult({
                    headers: result.data.column_names,
                    rows: result.data.sample_rows || [],
                    file_id: result.data.file_id
                })
                setMessage({ type: 'success', text: `✅ File uploaded and parsed! ${result.data.rows_count} records detected.` })
            } else {
                throw new Error(result.error || 'Upload failed')
            }
        } catch (error) {
            console.error('File upload error:', error)
            setMessage({ type: 'danger', text: `❌ Upload failed: ${error.message}` })
            setApiError(error.message)
        }
    }

    const handleClearFile = () => {
        setSelectedFile(null)
        setPreviewData(null)
        setParsingResult(null)
        setImportStatus('idle')
        setImportProgress(0)
        setCurrentImportId(null)
        setMappings({})
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // ========== COLUMN MAPPING HANDLERS ==========

    const handleColumnMapping = async () => {
        try {
            setMessage({ type: 'info', text: 'Saving column mappings...' })
            
            if (!currentImportId || !parsingResult) return
            
            // Create default mappings based on detected columns
            const defaultMappings = {}
            parsingResult.headers.forEach(header => {
                const cleanName = String(header).toLowerCase().replace(/\s+/g, '_')
                defaultMappings[header] = { field: cleanName, transform: null }
            })
            
            setMappings(defaultMappings)
            
            await api.saveColumnMapping(currentImportId, currentImportId, defaultMappings)
            setImportStatus('mapping_complete')
            setMessage({ type: 'success', text: `✅ Column mapping saved! ${Object.keys(defaultMappings).length} columns mapped.` })
        } catch (error) {
            console.error('Mapping error:', error)
            throw new Error(`Failed to save mappings: ${error.message}`)
        }
    }

    const updateMapping = (sourceColumn, field, transform) => {
        setMappings(prev => ({
            ...prev,
            [sourceColumn]: { field, transform }
        }))
    }

    // ========== IMPORT EXECUTION HANDLERS ==========

    const handleStartImport = async () => {
        if (!currentImportId || importStatus !== 'mapping_complete') {
            setMessage({ type: 'warning', text: 'Please complete column mapping before starting import.' })
            return
        }
        
        setImportStatus('processing')
        setImportProgress(0)
        setMessage(null)
    }

    const handleCompleteImport = async () => {
        try {
            setMessage({ type: 'info', text: 'Executing import...' })
            
            if (!currentImportId) return
            
            // Execute import via backend
            await api.executeImport(currentImportId, parseInt(currentImportId), 'employees')
            
            setImportStatus('completed')
            setImportProgress(100)
            setMessage({ type: 'success', text: '✅ Import completed successfully! All records imported.' })
        } catch (error) {
            console.error('Import error:', error)
            setImportStatus('failed')
            setMessage({ type: 'danger', text: `❌ Import failed: ${error.message}` })
        }
    }

    // ========== IMPORT HISTORY HANDLERS ==========

    const loadImportHistory = async () => {
        try {
            const history = await api.getImportHistory(10, 0)
            
            if (history.count > 0 && activeSection === 'progress') {
                setActiveSection('connections') // Go back to connections tab
            }
        } catch (error) {
            console.error('Failed to load import history:', error)
        }
    }

    const deleteCurrentImport = async () => {
        try {
            if (!window.confirm(`Delete import ${currentImportId}?`)) return
            
            await api.deleteImport(currentImportId)
            handleClearFile()
            setMessage({ type: 'success', text: `Import deleted successfully!` })
        } catch (error) {
            console.error('Delete error:', error)
            throw new Error(`Failed to delete import: ${error.message}`)
        }
    }

    // ========== HELPER FUNCTIONS ==========

    const setMessage = (msg) => {
        if (!msg) setApiError(null)
        else setApiError(msg.text)
    }

    return (
        <div className="container-fluid py-4">
            <Row>
                <Col md={8} mx-auto>
                    <Card>
                        {/* Tab Navigation */}
                        <ListGroup variant="flush" className="mb-3" style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                            <ListGroup.Item action active={activeSection === 'connections'} onClick={() => setActiveSection('connections')}>
                                🔗 <strong>Select Connection</strong> {savedConnections.length > 0 && <Badge bg="success" pill>{savedConnections.length}</Badge>}
                            </ListGroup.Item>
                            
                            <ListGroup.Item action active={activeSection === 'upload'} onClick={() => setActiveSection('upload')}>
                                📁 <strong>Upload File</strong> {selectedFile && <Badge bg="primary" pill>{selectedFile.name}</Badge>}
                            </ListGroup.Item>

                            <ListGroup.Item action active={activeSection === 'mapping'} onClick={() => setActiveSection('mapping')}>
                                📊 <strong>Map Columns</strong> {parsingResult && <Badge bg="info" pill>{parsingResult.rows.length} rows</Badge>}
                            </ListGroup.Item>

                            <ListGroup.Item action active={activeSection === 'progress'} onClick={() => setActiveSection('progress')}>
                                📈 <strong>Import Progress</strong> {importStatus === 'processing' ? <Badge bg="warning" pill>{importProgress}%</Badge> : importStatus === 'completed' ? <Badge bg="success" pill>Complete</Badge> : <Badge bg="secondary" pill>Ready</Badge>}
                            </ListGroup.Item>

                            <ListGroup.Item action active={activeSection === 'history'} onClick={() => setActiveSection('history')}>
                                📋 <strong>Import History</strong>
                            </ListGroup.Item>
                        </ListGroup>

                        {/* Alert Messages */}
                        {apiError && (
                            <Alert variant="danger" onClose={() => setApiError(null)} show dismissible>
                                ❌ {apiError}
                            </Alert>
                        )}
                        
                        {!apiError && message && (
                            <Alert variant={message.type} onClose={() => setMessage(null)} show dismissible>
                                {message.text}
                            </Alert>
                        )}

                        {/* ========== SECTION 1: CONNECTIONS ========== */}
                        {activeSection === 'connections' && (
                            <div className="p-4">
                                <h5 className="text-primary mb-4"><Badge bg="primary" className="me-2">Step 1</Badge>Configure Database Connection</h5>

                                {!savedConnections.length ? (
                                    <div className="mb-4 p-3 bg-light rounded mb-4">
                                        <h6 className="text-primary mb-3">Quick Start Presets</h6>
                                        <Row g-2>
                                            {[
                                                { server: 'Local MySQL Test DB', host: 'localhost', port: 3306, database: 'excel_importer_db', username: 'root' },
                                                { server: 'SQL Server Express', host: 'localhost', port: 1433, database: 'master', username: 'sa' }
                                            ].map((preset, index) => (
                                                <Col key={index} md={6}>
                                                    <Button variant="outline-primary" size="sm" onClick={() => loadPreset(preset)}>
                                                        {preset.server}
                                                    </Button>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                ) : null}

                                <Form onSubmit={handleSubmit}>
                                    <h6 className="text-muted mb-3">Connection Details</h6>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label><strong>Server Name *</strong></Form.Label>
                                                <Form.Control type="text" name="server" value={formData.server} onChange={handleChange} placeholder="e.g., My Production Server" required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label><strong>Host Address *</strong></Form.Label>
                                                <Form.Control type="text" name="host" value={formData.host} onChange={handleChange} placeholder="localhost" required />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label><strong>Port</strong></Form.Label>
                                                <Form.Control type="number" name="port" value={formData.port} onChange={handleChange} placeholder="1433" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={8}>
                                            <Form.Group className="mb-3">
                                                <Form.Label><strong>Database *</strong></Form.Label>
                                                <Form.Control type="text" name="database" value={formData.database} onChange={handleChange} placeholder="excel_importer_db" required />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label><strong>Username *</strong></Form.Label>
                                                <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} placeholder="root" required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label><strong>Password *</strong></Form.Label>
                                                <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} placeholder="" required />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="d-flex gap-2 mt-4 pt-3 border-top">
                                        <Button variant="primary" type="submit" disabled={loading}>
                                            {loading ? 'Testing...' : 'Test & Save Connection'}
                                        </Button>
                                        <Button variant="outline-secondary" onClick={() => handleSubmit({ preventDefault: () => {} })} disabled={loading}>Test Only</Button>
                                    </div>

                                    {savedConnections.length > 0 && (
                                        <>
                                            <h6 className="text-primary mt-4 mb-3"><Badge bg="success" className="me-2">Saved</Badge>Your Connections ({savedConnections.length})</h6>
                                            <ListGroup variant="flush">
                                                {savedConnections.map((conn) => (
                                                    <ListGroup.Item key={conn.id} action>
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="flex-grow-1">
                                                                <div className="fw-bold">{conn.server}</div>
                                                                <small className="text-muted d-block mt-1">{conn.host}:{conn.port} / {conn.database}</small>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 pt-2 border-top d-flex gap-1">
                                                            <Button variant="outline-primary" size="sm" onClick={() => loadPreset({ server: conn.server, ...conn })}>Use This</Button>
                                                            <Button variant="outline-danger" size="sm" onClick={() => deleteConnection(conn.id)}>Delete</Button>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </>
                                    )}
                                </Form>
                            </div>
                        )}

                        {/* ========== SECTION 2: UPLOAD ========== */}
                        {activeSection === 'upload' && (
                            <div className="p-4">
                                <h5 className="text-primary mb-4"><Badge bg="primary" className="me-2">Step 2</Badge>Select Your File</h5>

                                {selectedFile ? (
                                    <>
                                        <div className="p-3 mb-3 bg-success text-white rounded">✅ File Selected: {selectedFile.name} ({api.formatFileSize(selectedFile.size)})</div>
                                        
                                        {previewData && (
                                            <div className="mb-3 p-3 bg-light rounded">{previewData}</div>
                                        )}

                                        {parsingResult && (
                                            <Card className="mt-4 mb-4" border="info">
                                                <Card.Header as="h6" className="bg-info text-white">📊 Data Preview ({parsingResult.rows.length} rows)</Card.Header>
                                                <Card.Body>
                                                    <Row g-2>
                                                        {parsingResult.headers.slice(0, 4).map((header, index) => (
                                                            <Col key={index} md={6}>
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

                                        {!currentImportId ? (
                                            <Button variant="primary" className="mt-3" onClick={uploadToFileServer}>
                                                {uploadingFile ? 'Uploading...' : 'Upload to Server'}
                                            </Button>
                                        ) : (
                                            <>
                                                <Button variant="success" className="mt-3" onClick={() => setActiveSection('mapping')}>✅ Proceed to Column Mapping →</Button>
                                                <Button variant="outline-danger" className="mt-3" onClick={deleteCurrentImport}>Delete & Clear</Button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Select File</Form.Label>
                                        <div className="border p-4 text-center rounded bg-light" onClick={() => fileInputRef.current.click()}>
                                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
                                            <i className="bi bi-cloud-upload fs-1 d-block mb-2"></i>
                                            <p>Click to browse or drag & drop file here</p>
                                        </div>
                                    </Form.Group>
                                )}

                                {selectedFile && !currentImportId && (
                                    <Button variant="secondary" className="mt-3" onClick={handleClearFile}>Clear Selection</Button>
                                )}
                            </div>
                        )}

                        {/* ========== SECTION 3: MAPPING ========== */}
                        {activeSection === 'mapping' && (
                            <div className="p-4 text-center">
                                <h5 className="text-primary mb-4"><Badge bg="primary" className="me-2">Step 3</Badge>Map Columns</h5>

                                {!currentImportId ? (
                                    <div className="p-5">❌ Upload a file first!</div>
                                ) : importStatus === 'mapping_complete' ? (
                                    <Card className="mt-4 p-5 border-success" border="success">
                                        <Card.Body>
                                            <h3 className="text-success mb-3">✅ Column Mapping Complete!</h3>
                                            <p className="lead mb-4">Ready to import {parsingResult?.rows?.length || 0} records.</p>
                                            <Button variant="success" size="lg" onClick={() => setActiveSection('progress')}>→ Proceed to Import</Button>
                                        </Card.Body>
                                    </Card>
                                ) : (
                                    <div className="mb-4">
                                        {loading && <Spinner animation="border" />}
                                        {!loading && !selectedFile && <p>Please upload a file first.</p>}
                                        {!loading && selectedFile && parsingResult && (
                                            <>
                                                <Card className="mb-4">
                                                    <Card.Header as="h5">Column Mapping Interface</Card.Header>
                                                    <Card.Body>
                                                        <p className="text-muted mb-3">Map Excel columns to database fields.</p>
                                                        {loading ? (
                                                            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
                                                        ) : (
                                                            <>
                                                                <Row g-2>
                                                                    {parsingResult.headers.slice(0, 6).map((excelCol, index) => (
                                                                        <Col key={index} md={6}>
                                                                            <div className="d-flex align-items-center p-2 border rounded bg-light">
                                                                                <span className="badge bg-primary me-3">{excelCol}</span>
                                                                                <i className="bi bi-arrow-right mx-2"></i>
                                                                                <span className="text-muted small">Database Field</span>
                                                                            </div>
                                                                        </Col>
                                                                    ))}
                                                                </Row>
                                                                <Button variant="success" className="mt-3" onClick={handleColumnMapping}>✅ Complete Mapping & Proceed</Button>
                                                            </>
                                                        )}
                                                    </Card.Body>
                                                </Card>

                                                {parsingResult && (
                                                    <div className="mt-4 p-3 bg-info text-white rounded">
                                                        📊 Data Summary: {parsingResult.rows.length} rows × {parsingResult.headers.length} columns<br/>
                                                        Columns: {parsingResult.headers.join(', ')}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ========== SECTION 4: PROGRESS ========== */}
                        {activeSection === 'progress' && (
                            <div className="p-4 text-center">
                                <h5 className="text-primary mb-4"><Badge bg="primary" className="me-2">Step 4</Badge>Import Progress</h5>

                                {!currentImportId ? (
                                    <div className="p-5">❌ Upload a file first!</div>
                                ) : importStatus === 'processing' ? (
                                    <>
                                        <h6 className="mb-3">Import in Progress...</h6>
                                        <div className="progress mb-4" style={{ height: '30px' }}>
                                            <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${importProgress}%` }}>
                                                {importProgress}% Complete
                                            </div>
                                        </div>
                                        <Row className="text-center g-3 mb-4">
                                            <Col md={3}>Total: <strong>{parsingResult?.rows?.length || 0}</strong></Col>
                                            <Col md={3}>Imported: <strong>{Math.round((importProgress / 100) * (parsingResult?.rows?.length || 0))}</strong></Col>
                                            <Col md={3}>Status: <Badge bg="warning">{importProgress}%</Badge></Col>
                                        </Row>
                                        {importProgress === 100 ? (
                                            <>
                                                <Button variant="success" size="lg" onClick={handleCompleteImport}>✅ Complete Import</Button>
                                                <Button variant="outline-primary" className="mt-3" onClick={() => setActiveSection('mapping')}>← Back to Mapping</Button>
                                            </>
                                        ) : (
                                            <div className="text-muted mt-4">Please wait while import is processing...</div>
                                        )}
                                    </>
                                ) : importStatus === 'completed' ? (
                                    <Card border="success" className="mt-4">
                                        <Card.Header as="h5" className="bg-success text-white">✅ Import Completed!</Card.Header>
                                        <Card.Body className="text-center p-5">
                                            <i className="bi bi-check-circle-fill display-1 text-success mb-3"></i>
                                            <h4>All Records Imported</h4>
                                            <p className="lead text-muted">Successfully imported {parsingResult?.rows?.length || 0} records.</p>
                                            <Button variant="outline-primary" size="lg" onClick={() => setActiveSection('connections')}>← Back to Connections</Button>
                                        </Card.Body>
                                    </Card>
                                ) : importStatus === 'failed' ? (
                                    <div className="border border-danger rounded p-4">
                                        <h4 className="text-danger mb-3">Import Failed</h4>
                                        <Alert variant="danger">Please check the logs and try again.</Alert>
                                        <Button variant="outline-primary" onClick={() => { setImportStatus('idle'); setActiveSection('mapping'); }}>← Try Again</Button>
                                    </div>
                                ) : (
                                    <>
                                        <Card className="mb-4">
                                            <Card.Header as="h5">Ready to Import</Card.Header>
                                            <Card.Body>
                                                <p className="text-muted mb-3">Import {parsingResult?.rows?.length || 0} records into your database.</p>
                                                {!importStatus || importStatus === 'completed' ? (
                                                    <Button variant="primary" size="lg" onClick={handleStartImport} disabled={!currentImportId}>🚀 Start Import Process</Button>
                                                ) : null}
                                            </Card.Body>
                                        </Card>

                                        {importStatus !== 'mapping_complete' && parsingResult && (
                                            <Alert variant="warning">⚠️ Complete column mapping before starting import.</Alert>
                                        )}

                                        {parsingResult && (
                                            <>
                                                {!currentImportId ? null : importStatus === 'completed' ? (
                                                    <Button variant="outline-primary" className="mt-3" onClick={() => setActiveSection('mapping')}>← Back to Mapping</Button>
                                                ) : parsingResult.rows.length > 0 && currentImportId ? (
                                                    <Button variant="success" size="lg" className="mt-3" onClick={handleStartImport} disabled={!currentImportId || importStatus !== 'mapping_complete'}>🚀 Start Import</Button>
                                                ) : null}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ========== SECTION 5: HISTORY ========== */}
                        {activeSection === 'history' && (
                            <div className="p-4">
                                <h5 className="text-primary mb-4"><Badge bg="primary" className="me-2">Import History</Badge></h5>
                                {loading ? (
                                    <div className="text-center py-4"><Spinner animation="border" /></div>
                                ) : savedConnections.length === 0 ? (
                                    <div className="p-4 bg-light rounded text-muted">Create a connection first!</div>
                                ) : null}
                            </div>
                        )}

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
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
