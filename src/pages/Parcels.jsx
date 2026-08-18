import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { StatusBadge } from './Overview'

export default function Parcels() {
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'expeditions')),
      async (snap) => {
        const rawDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

        const enrichedDocs = await Promise.all(
          rawDocs.map(async (p) => {
            // 1. Expéditeur (Nom ou recherche via UID)
            let sender = p.senderName || p.expediteurName || p.expediteur || p.sender || p.clientName || p.clientPhone

            const uid = p.userId || p.senderId || p.clientId
            if (!sender && uid) {
              try {
                const userDoc = await getDoc(doc(db, 'users', uid))
                if (userDoc.exists()) {
                  const userData = userDoc.data()
                  sender = userData.displayName || userData.fullName || userData.name || userData.phone || uid
                }
              } catch (e) {
                console.error("Erreur récupération user:", e)
              }
            }

            // 2. Destinataire : Récupération directe du numéro recipientPhone
            const receiver = p.recipientPhone || p.destinatairePhone || p.receiverPhone || '—'

            return { 
              ...p, 
              resolvedSender: sender || '—',
              resolvedReceiver: receiver
            }
          })
        )

        // Tri par date
        enrichedDocs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setParcels(enrichedDocs)
        setLoading(false)
      },
      (error) => {
        console.error("Erreur chargement expéditions:", error)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  if (loading) {
    return (
      <div className="panel">
        <p style={{ padding: '1.5rem' }}>Chargement des colis...</p>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <h1>Colis</h1>
        <p>Suivi des envois de colis entre villes.</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>{parcels.length} colis</h3>
        </div>

        {parcels.length === 0 ? (
          <div className="empty-state">Aucun colis en cours.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Expéditeur</th>
                <th>Destinataire (Tél.)</th>
                <th>Trajet</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p) => {
                const departure = p.departure || p.from || p.depart || '—'
                const destination = p.destination || p.to || p.arrivee || '—'

                return (
                  <tr key={p.id}>
                    <td><code>{p.reference || p.code || p.id.slice(0, 8)}</code></td>
                    <td>{p.resolvedSender}</td>
                    <td>{p.resolvedReceiver}</td>
                    <td>{departure} → {destination}</td>
                    <td><StatusBadge status={p.status || 'pending'} /></td>
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