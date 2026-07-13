import { useState, useEffect } from 'react'
import { Card, Button, Form, Table, Alert, Row, Col } from 'react-bootstrap'

export default function ColumnMapping({ parsedData, onSubmit, onCancel }) {
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Load saved mappings if available
    if (parsedData?.id) {
      loadMappings(parsedData.id)
    } else {
      // Initialize default mappings based on preview headers
      initializeDefaultMappings()
    }
    
    setLoading(false)
  }, [parsedData])

  const initializeDefaultMappings = () => {
    if (!parsedData?.headers || parsedData.headers.length === 0) return
    
    // Create mapping for each header to a default DB column name
    const defaults = parsedData.headers.slice(0, 10).map((header, idx) => ({
      excelColumn: String(header),
      dbColumn: `col_${idx + 1}`
    }))
    
    setMappings(defaults)
  }

  const loadMappings = async (importId) => {
    try {
      const response = await fetch(`/api/imports/${importId}/mappings`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setMappings(result.data)
        } else {
          initializeDefaultMappings()
        }
      }
    } catch (error) {
      console.error('Failed to load mappings:', error)
      initializeDefaultMappings()
    }
  }

  const handleMappingChange = (index, field, value) => {
    const newMappings = [...mappings]
    newMappings[index][field] = value
    setMappings(newMappings)
  }

  const addNewColumn = () => {
    const nextIdx = mappings.length + 1
    setMappings([...mappings, { excelColumn: `Column ${nextIdx}`, dbColumn: `col_${nextIdx}` }])
  }

  const removeColumn = (index) => {
    if (mappings.length > 2) { // Keep at least 2 columns
      setMappings(mappings.filter((_, i) => i !== index))
    } else {
      Alert.show('Cannot remove the last two columns')
    }
  }

  const handleSubmit = () => {
    onSubmit(mappings)
  }

  if (loading && !parsedData) return <div className="text-center py-4">Loading...</div>

  return (
    <div className="container-fluid py-4">
      <Row>
        <Col md={8} mx-auto>
          <Card>
            <Card.Header as="h5" className="bg-success text-white">
              Map Excel Columns to Database Fields
            </Card.Header>
            <Card.Body>
              {parsedData && (
                <>
                  <Alert variant="info" onClose={() => {}}>
                    <strong>Total rows in file:</strong> {parsedData.total_rows} | 
                    <strong> Preview showing:</strong> {parsedData.preview_rows_count} rows
                  </Alert>

                  <Table striped bordered hover size="sm">
                    <thead className="table-dark">
                      <tr>
                        <th>Excel Column (Header)</th>
                        <th>Map To Database Column</th>
                        <th width="50"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((mapping, idx) => (
                        <tr key={idx}>
                          <td>
                            <Form.Control 
                              value={mapping.excelColumn}
                              onChange={(e) => handleMappingChange(idx, 'excelColumn', e.target.value)}
                              placeholder="Excel header name"
                            />
                          </td>
                          <td>
                            <Form.Control 
                              value={mapping.dbColumn}
                              onChange={(e) => handleMappingChange(idx, 'dbColumn', e.target.value)}
                              placeholder="DB column name"
                            />
                          </td>
                          <td className="text-center">
                            {mappings.length > 2 && (
                              <Button variant="outline-danger" size="sm" onClick={() => removeColumn(idx)}>
                                ×
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {mappings.length > 0 && (
                    <Button variant="outline-secondary" size="sm" className="mt-2" onClick={addNewColumn}>
                      + Add Column Mapping
                    </Button>
                  )}

                  {/* Data Preview */}
                  <div className="mt-4">
                    <h6>Data Preview (First 5 rows):</h6>
                    <Table striped bordered size="sm" responsive>
                      <thead>
                        <tr>
                          {parsedData.preview_data[0]?.map((cell, idx) => (
                            <th key={idx}>{mappings[idx]?.excelColumn || `Col ${idx + 1}`}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.preview_data.slice(1).slice(0, 4).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>{String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-4 pt-3 border-top">
                    <Button variant="success" onClick={handleSubmit}>
                      Save Mappings & Continue to Import
                    </Button>
                    <Button variant="outline-secondary" onClick={onCancel}>
                      Cancel - Back to Preview
                    </Button>
                  </div>
                </>
              )}

              {!parsedData && (
                <Alert variant="warning">
                  No parsed data available. Please upload a file first.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
