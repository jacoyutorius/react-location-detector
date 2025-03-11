import './App.css'
import Map from './Map'

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
    </div>
  )
}

export default App
