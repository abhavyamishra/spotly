export default function PresencePanel({ location, radius, onRefreshLocation }) {
  return (
    <section className="side-card">
      <div className="section-heading compact">
        <div>
          <div className="eyebrow">Location</div>
          <div className="section-title">Presence</div>
        </div>
      </div>

      <div className="presence-grid">
        <span>Radius</span>
        <strong>{radius}m</strong>
      </div>

      <div className="presence-grid">
        <span>Status</span>
        <strong>{location.lat ? "Ready" : "Unknown"}</strong>
      </div>

      <div className="meta">
        {location.lat ? `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}` : "Location not set yet"}
      </div>

      <button className="secondary wide" onClick={onRefreshLocation}>Refresh location</button>
    </section>
  );
}
