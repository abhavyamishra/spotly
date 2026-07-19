import FormRow from "./FormRow.jsx";

export default function RoomCreator({
  roomName,
  description,
  allowPending,
  onRoomNameChange,
  onDescriptionChange,
  onTogglePending,
  onCreateRoom,
}) {
  return (
    <section className="room-composer">
      <div className="composer-header">
        <div>
          <div className="eyebrow">Create</div>
          <div className="section-title">Start a local room</div>
        </div>
      </div>

      <div className="composer-grid">
        <FormRow label="Room name">
          <input value={roomName} onChange={(e) => onRoomNameChange(e.target.value)} placeholder="traffic-near-lalpath" />
        </FormRow>

        <FormRow label="Topic">
          <input value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="What should nearby people talk about?" />
        </FormRow>
      </div>


      <div className="composer-actions">
        <label className="toggle-row compact-toggle">
          <input type="checkbox" checked={allowPending} onChange={(e) => onTogglePending(e.target.checked)} />
          <span>
            <strong>Wait for nearby users</strong>
            <small>Useful when nobody is around yet.</small>
          </span>
        </label>

        <button className="primary" onClick={onCreateRoom}>Create Room</button>
      </div>
    </section>
  );
}
