import { useState } from 'react'
import Navbar from './components/Navbar'
import UnifiedImport from './components/UnifiedImport'

function App() {
  return (
    <div className="min-vh-100 bg-dark bg-gradient position-relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="position-fixed w-100 h-100" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        opacity: 0.1
      }} />
      <div className="position-fixed top-0 start-0 p-5" style={{
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div className="position-fixed bottom-0 end-0 p-5" style={{
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />

      <div className="container py-4 position-relative z-1">
        <Navbar activeTab="unified" onChangeTab={() => {}} />
        
        <main className="py-5" style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h1 className="mb-4 text-center text-white" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            fontWeight: '700',
            fontSize: '2.5rem'
          }}>
            Excel to MSSQL Importer
          </h1>
          
          <div className="p-4" style={{
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <UnifiedImport />
          </div>
        </main>

        <footer className="text-center text-white mt-5" style={{
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '15px',
          borderRadius: '10px'
        }}>
          <p className="mb-0">Excel to MSSQL Importer © 2026 - Unified Interface</p>
        </footer>
      </div>
    </div>
  )
}

export default App
