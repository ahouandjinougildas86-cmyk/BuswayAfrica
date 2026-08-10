import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">{children}</main>
    </div>
  )
}
