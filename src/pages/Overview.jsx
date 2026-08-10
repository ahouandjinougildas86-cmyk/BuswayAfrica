import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import StatCard from '../components/StatCard'
import { useTrajets } from '../hooks/useTrajets'

export default function Overview() {
  const [stats, setStats] = useState({
    bookingsToday: 0,
    trajetsDisponibles: 0,
    pendingDrivers: 0,
    parcelsInTransit: 0,
  })
  const [recentBookings, setRecentBookings] = useState([])
  const { trajetsById, trajetsList } = useTrajets()

  useEffect(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    // Réservations du jour, en temps réel : dès qu'une réservation est
    // créée côté app mobile, le compteur se met à jour tout seul.
    const unsubBookings = onSnapshot(
      query(collection(db, 'reservations'), where('createdAt', '>=', startOfToday)),
      (snap) => setStats((s) => ({ ...s, bookingsToday: snap.size }))
    )

    // Chauffeurs : stockés dans "users" avec role == "driver", pas dans une
    // collection à part. On filtre "pending" côté client.
    const unsubDrivers = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'driver')),
      (snap) => {
        const pending = snap.docs.filter((d) => d.data().status === 'pending').length
        setStats((s) => ({ ...s, pendingDrivers: pending }))
      }
    )

    // Colis : collection à confirmer plus tard (pas encore vérifiée avec Rolf).
    // On tente "parcels" ; si la collection n'existe pas encore, ça reste à 0.
    const unsubParcels = onSnapshot(
      query(collection(db, 'parcels'), where('status', '==', 'in_transit')),
      (snap) => setStats((s) => ({ ...s, parcelsInTransit: snap.size }))
    )

    const unsubRecent = onSnapshot(
      query(collection(db, 'reservations')),
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 6)
        setRecentBookings(rows)
      }
    )

    return () => {
      unsubBookings()
      unsubDrivers()
      unsubParcels()
      unsubRecent()
    }
  }, [])

  useEffect(() => {
    setStats((s) => ({ ...s, trajetsDisponibles: trajetsList.filter((t) => (t.availableSeats ?? 0) > 0).length }))
  }, [trajetsList])

  return (
    <>
      <div className="page-header">
        <h1>Vue d'ensemble</h1>
        <p>Ce qui se passe sur le réseau Busway Africa, en direct.</p>
      </div>

      <div className="stat-grid">
        <StatCard label="Réservations aujourd'hui" value={stats.bookingsToday} />
        <StatCard label="Trajets disponibles" value={stats.trajetsDisponibles} />
        <StatCard label="Chauffeurs en attente" value={stats.pendingDrivers} />
        <StatCard label="Colis en transit" value={stats.parcelsInTransit} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Dernières réservations</h3>
        </div>
        {recentBookings.length === 0 ? (
          <div className="empty-state">Aucune réservation pour l'instant.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trajet</th>
                <th>Client</th>
                <th>Statut</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => {
                const trajet = trajetsById[b.trajetId]
                const departure = trajet?.departure || b.departure || '—'
                const destination = trajet?.destination || b.destination || '—'
                return (
                  <tr key={b.id}>
                    <td>{departure} → {destination}</td>
                    <td>{b.clientName || b.clientPhone || '—'}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{b.totalPaid ? `${b.totalPaid} FCFA` : (b.price ? `${b.price} FCFA` : '—')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export function StatusBadge({ status }) {
  const map = {
    confirmed: { label: 'Confirmée', tone: 'success' },
    pending: { label: 'En attente', tone: 'warning' },
    cancelled: { label: 'Annulée', tone: 'danger' },
    completed: { label: 'Terminée', tone: 'neutral' },
    active: { label: 'Actif', tone: 'success' },
    in_transit: { label: 'En transit', tone: 'warning' },
    delivered: { label: 'Livré', tone: 'success' },
    driver: { label: 'Chauffeur', tone: 'neutral' },
  }
  const entry = map[status] || { label: status || 'Inconnu', tone: 'neutral' }
  return <span className={`badge ${entry.tone}`}>{entry.label}</span>
}
