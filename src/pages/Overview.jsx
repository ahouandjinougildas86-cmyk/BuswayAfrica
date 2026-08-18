import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore'
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
  const [recentActivities, setRecentActivities] = useState([])
  const { trajetsById, trajetsList } = useTrajets()

  useEffect(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    // 1. Réservations passagers aujourd'hui
    const unsubBookings = onSnapshot(
      query(collection(db, 'reservations'), where('createdAt', '>=', startOfToday)),
      (snap) => setStats((s) => ({ ...s, bookingsToday: snap.size }))
    )

    // 2. Chauffeurs en attente
    const unsubDrivers = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'driver')),
      (snap) => {
        const pending = snap.docs.filter((d) => d.data().status === 'pending').length
        setStats((s) => ({ ...s, pendingDrivers: pending }))
      }
    )

    // 3. Compteur total de la collection "expeditions"
    const unsubExpeditions = onSnapshot(
      collection(db, 'expeditions'),
      (snap) => setStats((s) => ({ ...s, parcelsInTransit: snap.size })),
      (err) => console.log("Erreur chargement expéditions:", err)
    )

    // 4. Charger, fusionner et enrichir Réservations ET Expéditions
    let bookingsList = []
    let expeditionsList = []

    const updateCombinedList = async () => {
      const combined = [...bookingsList, ...expeditionsList]
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 8)

      // Résolution des noms d'expéditeurs/clients manquants depuis Firestore users
      const enriched = await Promise.all(
        combined.map(async (item) => {
          let name = item.itemType === 'expedition'
            ? (item.senderName || item.expediteurName || item.expediteur || item.sender)
            : (item.clientName || item.clientPhone)

          const uid = item.userId || item.senderId || item.clientId
          if (!name && uid) {
            try {
              const userDoc = await getDoc(doc(db, 'users', uid))
              if (userDoc.exists()) {
                const uData = userDoc.data()
                name = uData.displayName || uData.fullName || uData.name || uData.phone
              }
            } catch (e) {
              console.error("Erreur résolution nom user:", e)
            }
          }

          return {
            ...item,
            resolvedName: name || item.clientPhone || item.senderPhone || '—'
          }
        })
      )

      setRecentActivities(enriched)
    }

    const unsubRecentBookings = onSnapshot(collection(db, 'reservations'), (snap) => {
      bookingsList = snap.docs.map((d) => ({ id: d.id, itemType: 'ticket', ...d.data() }))
      updateCombinedList()
    })

    const unsubRecentExpeditions = onSnapshot(collection(db, 'expeditions'), (snap) => {
      expeditionsList = snap.docs.map((d) => ({ id: d.id, itemType: 'expedition', ...d.data() }))
      updateCombinedList()
    })

    return () => {
      unsubBookings()
      unsubDrivers()
      unsubExpeditions()
      unsubRecentBookings()
      unsubRecentExpeditions()
    }
  }, [])

  useEffect(() => {
    setStats((s) => ({
      ...s,
      trajetsDisponibles: trajetsList.filter((t) => (t.availableSeats ?? 0) > 0).length,
    }))
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
        <StatCard label="Colis / Expéditions" value={stats.parcelsInTransit} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Dernières activités (Billets & Expéditions)</h3>
        </div>
        {recentActivities.length === 0 ? (
          <div className="empty-state">Aucune activité enregistrée.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Détails / Trajet</th>
                <th>Client / Expéditeur</th>
                <th>Statut</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((item) => {
                const isExpedition = item.itemType === 'expedition'

                if (isExpedition) {
                  const departure = item.departure || item.from || item.depart || '—'
                  const destination = item.destination || item.to || item.arrivee || '—'
                  const price = item.price || item.amount || item.prix

                  return (
                    <tr key={item.id}>
                      <td><span className="badge neutral">📦 Expédition</span></td>
                      <td>{departure} → {destination}</td>
                      <td>{item.resolvedName}</td>
                      <td><StatusBadge status={item.status || 'pending'} /></td>
                      <td>{price ? `${price} FCFA` : '—'}</td>
                    </tr>
                  )
                }

                // Billet passager
                const trajet = trajetsById[item.trajetId]
                const departure = trajet?.departure || item.departure || '—'
                const destination = trajet?.destination || item.destination || '—'
                return (
                  <tr key={item.id}>
                    <td><span className="badge success">🎟️ Billet</span></td>
                    <td>{departure} → {destination}</td>
                    <td>{item.resolvedName}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>{item.totalPaid ? `${item.totalPaid} FCFA` : item.price ? `${item.price} FCFA` : '—'}</td>
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