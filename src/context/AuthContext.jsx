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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (!userDoc.exists()) {
            console.error(`❌ Erreur Auth : Aucun document trouvé dans Firestore pour l'UID "${firebaseUser.uid}" dans la collection "users".`)
            await signOut(auth)
            setUser(null)
            setIsAdmin(false)
          } else {
            const data = userDoc.data()
            console.log("📄 Données récupérées dans Firestore :", data)

            // Vérification souple du rôle (accepte role === "admin" OU isAdmin === true)
            if (data.role === 'admin' || data.isAdmin === true) {
              console.log("✅ Accès Admin confirmé !")
              setUser(firebaseUser)
              setIsAdmin(true)
            } else {
              console.error(`❌ Erreur Auth : Le rôle trouvé est "${data.role}", attendu "admin".`)
              await signOut(auth)
              setUser(null)
              setIsAdmin(false)
            }
          }
        } catch (err) {
          console.error("❌ Erreur de lecture dans Firestore (Règles de sécurité ?) :", err)
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