import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STOPS = [
  { to: '/', label: "Vue d'ensemble", end: true },
  { to: '/reservations', label: 'Réservations' },
  { to: '/trajets', label: 'Trajets' },
  { to: '/chauffeurs', label: 'Chauffeurs' },
  { to: '/colis', label: 'Colis' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">B</div>
        <div className="sidebar-brand-text">
          Busway Africa
          <span>Poste de contrôle</span>
        </div>
      </div>

      <nav className="route-nav">
        {STOPS.map((stop) => (
          <NavLink
            key={stop.to}
            to={stop.to}
            end={stop.end}
            className={({ isActive }) => `route-stop${isActive ? ' active' : ''}`}
          >
            <span className="route-stop-dot" />
            {stop.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-user">{user?.email}</span>
        <button className="logout-btn" onClick={logout}>Déconnexion</button>
      </div>
    </aside>
  )
}
