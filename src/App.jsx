import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Bookings from './pages/Bookings'
import RoutesPage from './pages/RoutesPage'
import Drivers from './pages/Drivers'
import Parcels from './pages/Parcels'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute><Layout><Overview /></Layout></ProtectedRoute>
          } />
          <Route path="/reservations" element={
            <ProtectedRoute><Layout><Bookings /></Layout></ProtectedRoute>
          } />
          <Route path="/trajets" element={
            <ProtectedRoute><Layout><RoutesPage /></Layout></ProtectedRoute>
          } />
          <Route path="/chauffeurs" element={
            <ProtectedRoute><Layout><Drivers /></Layout></ProtectedRoute>
          } />
          <Route path="/colis" element={
            <ProtectedRoute><Layout><Parcels /></Layout></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
