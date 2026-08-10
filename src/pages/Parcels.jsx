import { useEffect, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase'
import { StatusBadge } from './Overview'

export default function Parcels() {
  const [parcels, setParcels] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'parcels')), (snap) =>
      setParcels(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

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
                <th>Destinataire</th>
                <th>Trajet</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p) => (
                <tr key={p.id}>
                  <td>{p.reference || p.id.slice(0, 8)}</td>
                  <td>{p.senderName || '—'}</td>
                  <td>{p.receiverName || '—'}</td>
                  <td>{p.departure || '—'} → {p.destination || '—'}</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
