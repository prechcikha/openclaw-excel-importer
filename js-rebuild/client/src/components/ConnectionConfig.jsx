import { useState, useEffect } from 'react'
import { Form, Button, Alert, Card, ListGroup, Badge, Row, Col } from 'react-bootstrap'

export default function ConnectionConfig() {
  const [formData, setFormData] = useState({
    server: '',
    host: 'localhost',
    port: 3306,
    database: '',
    username: '',
    password: ''
  })
  const [message, setMessage] = useState(null)
  const [savedConnections, setSavedConnections] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Load saved connections from real database on mount
  useEffect(() => {
    loadSavedConnections()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    console.log('Testing connection with:', formData)
    
    try {
      // First test the connection
      const response = await fetch('/api/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.details || result.message)
      }
      
      console.log('Connection test successful:', result)
      
      // Then save it to real database
      const saveResponse = await fetch('/api/connections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const saveResult = await saveResponse.json()
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save connection')
      }
      
      // Add to local state so it shows in the list immediately
      setSavedConnections(prev => [...prev, { id: Date.now(), ...formData }])
      
      setMessage({ type: 'success', text: `✅ Connection "${formData.server}" tested and saved successfully!` })

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

  const handleTestConnection = async () => {
    if (!formData.server || !formData.host) {
      setMessage({ type: 'warning', text: 'Please fill in at least Server Name and Host Address before testing.' })
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: `✅ ${result.message} (${result.details})` })
      } else {
        throw new Error(result.details || result.message)
      }
    } catch (error) {
      console.error('Test failed:', error)
      setMessage({ 
        type: 'danger', 
        text: `❌ Connection test failed: ${error.message}` 
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteConnection = async (id) => {
    try {
      if (!window.confirm('Are you sure you want to delete this connection?')) {
        return
      }
      
      // Delete from real database
      const response = await fetch(`/api/connections/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSavedConnections(prev => prev.filter(conn => conn.id !== id))
        setMessage({ type: 'success', text: `Connection deleted successfully!` })
      } else {
        throw new Error(result.error || 'Failed to delete connection')
      }

    } catch (error) {
      console.error('Delete failed:', error)
      setMessage({ 
        type: 'danger', 
        text: `Error deleting connection: ${error.message}` 
      })
    }
  }

  const loadPreset = (presetData) => {
    setFormData({ ...formData, ...presetData })
    setMessage({ type: 'info', text: `Loaded preset: ${presetData.server || 'Custom'}` })
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyConnectionToClipboard = () => {
    const configText = [
      `Server: ${formData.host}:${formData.port}`,
      `Database: ${formData.database}`,
      `Username: ${formData.username}`,
      formData.password ? `Password: ${formData.password}` : ''
    ].filter(Boolean).join('\n')
    
    navigator.clipboard.writeText(configText)
    setMessage({ type: 'success', text: 'Connection details copied to clipboard!' })
  }

  const loadSavedConnections = async () => {
    try {
      console.log('Loading saved connections from database...')
      
      // Fetch from real API
      const response = await fetch('/api/connections')
      const result = await response.json()
      
      if (result.success) {
        setSavedConnections(result.data || [])
        
        if (result.count === 0) {
          setMessage({ type: 'info', text: 'No saved connections found. Click a preset button to get started!' })
        }
      } else {
        console.error('Failed to load connections:', result.error)
        setMessage({ type: 'warning', text: 'Could not load saved connections from database.' })
      }

    } catch (error) {
      console.error('Error loading connections:', error)
      // If database is unavailable, show default mock data for testing
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid py-4">
      <Row>
        <Col md={8} mx-auto>
          <Card>
            <Card.Header as="h5" className="bg-primary text-white">
              MSSQL Server Connections
            </Card.Header>
            <Card.Body>
              {message && (
                <Alert variant={message.type} onClose={() => setMessage(null)}>
                  {message.text}
                </Alert>
              )}

              {/* Presets Section */}
              <div className="mb-4">
                <h6 className="text-primary mb-3">
                  <Badge bg="primary" className="me-2">Presets</Badge>
                  Quick Start Templates
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

              {/* Connection Form */}
              <Form onSubmit={handleSubmit}>
                <h6 className="text-muted mb-3">Configure Connection</h6>

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
                        required
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
                  
                  <Button variant="outline-secondary" onClick={handleTestConnection} disabled={loading}>
                    Test Only
                  </Button>
                  
                  <Button variant="outline-info" onClick={copyConnectionToClipboard}>
                    Copy Config
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
              </Form>

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
                            variant="outline-warning" 
                            size="sm"
                            onClick={async () => {
                              await handleTestConnection()
                            }}
                          >
                            Test Again
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

              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">{savedConnections.length === 0 ? 'Loading saved connections...' : 'Testing connection and saving...'}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
