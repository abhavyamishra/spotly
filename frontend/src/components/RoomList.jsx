export default function RoomList({
  rooms,
  title,
  eyebrow,
  emptyMessage,
  isNearby = false,
  tone = "default",
  onJoin,
  onOpen,
}) {
  return (
    <section className={`room-section ${tone}`}>
      {(title || eyebrow) && (
        <div className="section-heading">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <div className="section-title">{title}</div>}
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <div className="room-stack">
          {rooms.map((room) => (
            <article
              className="room-post"
              key={room.name}
              onClick={() => {
                if (!isNearby && onOpen) {
                  onOpen(room);
                }
              }}
              role={!isNearby ? "button" : undefined}
              tabIndex={!isNearby ? 0 : undefined}
            >
              <div className="room-icon">#</div>

              <div className="room-main">
                <div className="room-topline">
                  <strong>{room.name}</strong>
                  <span className="member-pill">{room.membersCount ?? "-"} members</span>
                </div>
                <p>{room.description || "Local conversation"}</p>
                <div className="room-footer">
                  <span>{isNearby ? "Available nearby" : "Open chat"}</span>
                  <span>{room.pending ? "Pending" : "Live"}
                    
                  </span>
                  {!room.pending && room.membersCount === 1 && (
                      <span className="membber-pill">
                        No one joined yet
                      </span>
                    )}
                </div>
              </div>

              {isNearby && (
                <button
                  className="primary small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoin(room);
                  }}
                >
                  Join
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
