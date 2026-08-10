import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { StatusBadge } from './Overview'
import { useTrajets } from '../hooks/useTrajets'

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const { trajetsById } = useTrajets()

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'reservations'), orderBy('createdAt', 'desc')),
      (snap) => setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  return (
    <>
      <div className="page-header">
        <h1>Réservations</h1>
        <p>Toutes les réservations passées sur l'app Busway Africa.</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>{filtered.length} réservation(s)</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
              <button
                key={f}
                className="btn btn-ghost"
                style={filter === f ? { background: '#EEF4FC', color: 'var(--blue-primary)', borderColor: 'var(--blue-mid)' } : undefined}
                onClick={() => setFilter(f)}
              >
                {labelFor(f)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">Aucune réservation ne correspond à ce filtre.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trajet</th>
                <th>Client</th>
                <th>Chauffeur</th>
                <th>Place(s)</th>
                <th>Statut</th>
                <th>Payé</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                // La réservation ne porte pas toujours departure/destination :
                // on va chercher ces infos sur le trajet lié via trajetId.
                const trajet = trajetsById[b.trajetId]
                const departure = trajet?.departure || b.departure || '—'
                const destination = trajet?.destination || b.destination || '—'
                return (
                  <tr key={b.id}>
                    <td>{departure} → {destination}</td>
                    <td>
                      {b.clientName || '—'}
                      {b.clientPhone && <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{b.clientPhone}</div>}
                    </td>
                    <td>{b.driverName || '—'}</td>
                    <td>{b.nbPlaces ?? 1}{b.seat ? ` (${b.seat})` : ''}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      {b.totalPaid ? `${b.totalPaid} FCFA` : (b.price ? `${b.price} FCFA` : '—')}
                      {b.payMethod && <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{labelForPayMethod(b.payMethod)}</div>}
                    </td>
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

function labelFor(f) {
  return {
    all: 'Tout',
    pending: 'En attente',
    confirmed: 'Confirmées',
    completed: 'Terminées',
    cancelled: 'Annulées',
  }[f]
}

function labelForPayMethod(m) {
  return { mtn: 'MTN MoMo', moov: 'Moov Money', celtis: 'Celtis Cash' }[m] || m
}
