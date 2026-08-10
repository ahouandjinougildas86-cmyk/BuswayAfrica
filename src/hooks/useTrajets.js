import { useEffect, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase'

// Charge la collection "trajets" et la garde sous forme de map { id: data }.
// Sert à "joindre" une réservation à son trajet via reservation.trajetId,
// car la réservation elle-même ne stocke pas toujours departure/destination.
export function useTrajets() {
  const [trajetsById, setTrajetsById] = useState({})
  const [trajetsList, setTrajetsList] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'trajets')), (snap) => {
      const map = {}
      const list = []
      snap.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() }
        map[d.id] = data
        list.push(data)
      })
      setTrajetsById(map)
      setTrajetsList(list)
    })
    return unsub
  }, [])

  return { trajetsById, trajetsList }
}
