import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { StatusBadge } from './Overview'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])

  useEffect(() => {
    // Les chauffeurs ne sont pas dans une collection à part : ils vivent
    // dans "users" avec le champ role == "driver" (même pattern que pour
    // repérer les admins).
    const unsub = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'driver')),
      (snap) => setDrivers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  async function setStatus(id, status) {
    // Écriture protégée côté Firestore Security Rules : seul un compte
    // avec role == "admin" peut modifier le document d'un autre user
    await updateDoc(doc(db, 'users', id), { status })
  }

  return (
    <>
      <div className="page-header">
        <h1>Chauffeurs</h1>
        <p>Validation des comptes chauffeurs et suivi de leur statut.</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>{drivers.length} chauffeur(s)</h3>
        </div>

        {drivers.length === 0 ? (
          <div className="empty-state">Aucun chauffeur enregistré pour l'instant.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Trajets</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>{d.name || '—'}</td>
                  <td>{d.email || '—'}</td>
                  <td>{d.phone || '—'}</td>
                  <td>{d.totalTrips ?? 0}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    {d.status === 'pending' && (
                      <>
                        <button className="btn btn-primary" onClick={() => setStatus(d.id, 'active')}>
                          Valider
                        </button>
                        <button className="btn btn-ghost" onClick={() => setStatus(d.id, 'rejected')}>
                          Refuser
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
