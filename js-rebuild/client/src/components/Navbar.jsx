import { Nav } from 'react-bootstrap'

export default function Navbar({ activeTab, onChangeTab }) {
  const tabs = [
    { id: 'unified', label: '🎯 Import Wizard' }
  ]

  return (
    <nav style={{
      backdropFilter: 'blur(20px)',
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '15px 30px',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    }}>
      <div className="container-fluid">
        <h4 className="text-white mb-0 fw-bold" style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          fontSize: '1.5rem'
        }}>
          Excel to MSSQL Importer
        </h4>
        
        <Nav className="justify-content-center my-3">
          {tabs.map((tab) => (
            <Nav.Link 
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`px-4 py-2 rounded-pill transition-all ${
                activeTab === tab.id ? 'text-white' : 'text-light'
              }`}
              style={{
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </Nav.Link>
          ))}
        </Nav>
      </div>
    </nav>
  )
}
