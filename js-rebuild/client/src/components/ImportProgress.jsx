import { useState } from 'react'
import { Card, Alert } from 'react-bootstrap'

export default function ImportProgress() {
  const [progress, setProgress] = useState({
    totalRows: 0,
    imported: 0,
    failed: 0,
    status: 'idle', // idle, running, completed, error
    message: ''
  })

  const simulateImport = () => {
    setProgress(prev => ({ ...prev, status: 'running', totalRows: 150 }))
    
    // Simulate progress updates
    let current = 0
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 20) + 1
      
      if (current >= 150) {
        current = 150
        clearInterval(interval)
        setProgress({
          totalRows: 150,
          imported: 150,
          failed: 0,
          status: 'completed',
          message: 'Import completed successfully!'
        })
      } else {
        setProgress({
          ...prev,
          imported: current,
          status: 'running',
          message: `Processing... ${Math.round((current / 150) * 100)}%`
        })
      }
    }, 300)
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <Card title="Import Progress" />
        
        {progress.status === 'idle' && (
          <Alert variant="info">
            No active imports. Click "Start Import" to begin processing your uploaded file.
          </Alert>
        )}

        {(progress.status === 'running' || progress.status === 'completed') && (
          <>
            <div className="d-flex justify-content-between mb-2">
              <span>Total Rows: {progress.totalRows}</span>
              <span>{progress.imported} imported</span>
            </div>

            <div className="progress mb-3" style={{ height: '30px' }}>
              <div 
                className={`progress-bar progress-bar-striped progress-bar-animated ${
                  progress.status === 'completed' ? 'bg-success' : ''
                }`}
                role="progressbar"
                style={{ width: `${(progress.imported / progress.totalRows) * 100}%` }}
              >
                {Math.round((progress.imported / progress.totalRows) * 100)}%
              </div>
            </div>

            <Alert variant={progress.status === 'completed' ? 'success' : 'warning'}>
              {progress.message}
            </Alert>

            <Button 
              variant="primary" 
              onClick={() => {
                setProgress({
                  totalRows: 0,
                  imported: 0,
                  failed: 0,
                  status: 'idle',
                  message: ''
                })
              }}
              className="mt-3"
            >
              Start New Import
            </Button>
          </>
        )}

        <div className="mt-4">
          <h5>Import History</h5>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <span><strong>Data_Export.xlsx</strong> - 2026-07-12</span>
              <span className="badge bg-success rounded-pill">Completed</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              <span><strong>Sales_Report.csv</strong> - 2026-07-11</span>
              <span className="badge bg-success rounded-pill">Completed</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
