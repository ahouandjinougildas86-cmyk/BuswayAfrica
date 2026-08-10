import { useTrajets } from '../hooks/useTrajets'

export default function RoutesPage() {
  const { trajetsList } = useTrajets()

  return (
    <>
      <div className="page-header">
        <h1>Trajets</h1>
        <p>Les liaisons desservies par Busway Africa.</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>{trajetsList.length} trajet(s)</h3>
          <button className="btn btn-primary">+ Ajouter un trajet</button>
        </div>

        {trajetsList.length === 0 ? (
          <div className="empty-state">Aucun trajet enregistré pour l'instant.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trajet</th>
                <th>Départ</th>
                <th>Arrivée</th>
                <th>Places disponibles</th>
                <th>Chauffeur</th>
              </tr>
            </thead>
            <tbody>
              {trajetsList.map((t) => (
                <tr key={t.id}>
                  <td>{t.departure || '—'} → {t.destination || '—'}</td>
                  <td>{t.departureTime || '—'}</td>
                  <td>{t.arrivalTime || '—'}</td>
                  <td>{t.availableSeats ?? '—'}</td>
                  <td>
                    {t.driverName || '—'}
                    {t.driverRating != null && (
                      <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}> · ★ {t.driverRating}</span>
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
