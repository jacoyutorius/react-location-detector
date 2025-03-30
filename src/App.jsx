import './App.css'
import Map from './Map'
import { AppNotification } from './services/NotificationService.jsx'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>GeoLocator</h1>
      </header>
      <main className="app-main">
        <Map />
      </main>
      <footer className="app-footer">
        <p>© 2025 GeoLocator</p>
      </footer>
      
      {/* アプリ内通知コンポーネント */}
      <AppNotification />
    </div>
  )
}

export default App
