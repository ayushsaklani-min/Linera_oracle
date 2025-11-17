import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import Subscription from './pages/Subscription'
import ApiDocs from './pages/ApiDocs'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/api-docs" element={<ApiDocs />} />
      </Routes>
    </Layout>
  )
}

export default App
