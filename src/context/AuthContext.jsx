import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChanged se déclenche à chaque changement de session
    // (connexion, déconnexion, rechargement de page)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // On va chercher le document utilisateur dans Firestore pour vérifier
        // que son rôle est bien "admin". C'est CETTE vérification qui protège
        // le dashboard, pas juste le fait d'être connecté.
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        const role = userDoc.exists() ? userDoc.data().role : null

        if (role === 'admin') {
          setUser(firebaseUser)
          setIsAdmin(true)
        } else {
          // Connecté mais pas admin -> on le déconnecte immédiatement
          await signOut(auth)
          setUser(null)
          setIsAdmin(false)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
    // La vérification du rôle se fait automatiquement via onAuthStateChanged ci-dessus
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
