import { useNavigate } from "react-router-dom";
import RoomCreator from "../components/RoomCreator";
import RoomTabs from "../components/RoomTabs";

export default function Dashboard({
  profileOpen,
  setProfileOpen,
  user,
  rooms,
  nearby,
  roomName,
  description,
  allowPending,
  location,
  onLogout,
  onCreateRoom,
  onJoinRoom,
  onRoomNameChange,
  onDescriptionChange,
  onTogglePending,
  onOpenRoom,
  handleAvatarUpload,
}) {

  const navigate = useNavigate();
  const createdRooms = rooms.filter(
    (room) => room.ownerId === user.userId
  );

  const joinedRooms = rooms.filter(
    (room) => room.ownerId !== user.userId
  );

  const avatarInitial = (
    user.displayName ||
    user.username ||
    "S"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div className="dashboard">

      {/* HEADER */}

      <>
  <header className="topbar">

    <div className="topbar-left">

      <button
        className="menu-btn"
        onClick={() => setProfileOpen(true)}
      >
        ☰
      </button>

      <div className="brand">
        <strong>Spotly</strong>
        <span className="brand-suffix">Local chat</span>
      </div>

    </div>

    <div className="signed-user">
      Signed in as {user.username}
    </div>

  </header>

  <section className="hero">

    <h1>Nearby conversations</h1>

    <p>
      Join or create discussions happening around you.
    </p>

  </section>
</>


      {/* CREATE ROOM */}

      <section className="create-room-card">

        <RoomCreator
          roomName={roomName}
          description={description}
          allowPending={allowPending}
          onRoomNameChange={onRoomNameChange}
          onDescriptionChange={onDescriptionChange}
          onTogglePending={onTogglePending}
          onCreateRoom={onCreateRoom}
        />

      </section>


      {/* ROOMS */}

      <section className="rooms-card">

        <RoomTabs
          nearby={nearby}
          created={createdRooms}
          joined={joinedRooms}
          onJoin={onJoinRoom}
          onOpen={onOpenRoom}
          locationReady={location.lat != null}
        />

      </section>


      {/* PROFILE DRAWER */}

      {profileOpen && (
        <button
          className="drawer-overlay"
          onClick={() => setProfileOpen(false)}
        />
      )}

      <aside className={profileOpen ? "profile-drawer open" : "profile-drawer"}>

  <button
    className="drawer-close"
    onClick={() => setProfileOpen(false)}
  >
    ✕
  </button>

  <div className="drawer-content">

    <div className="avatar-preview large">

      {user.avatar ? (

      <img
          src={`http://localhost:3000/${user.avatar}`}
          alt="avatar"
      />

      ):(

      avatarInitial

      )}

    </div>

    <h2 className="drawer-name">
      {user.displayName || user.username}
    </h2>

    <div className="drawer-username">
      @{user.username}
    </div>

    <div className="drawer-email">
      {user.email}
    </div>

    <div className="drawer-location">
      <div className="location-title">
        Live Location
      </div>

      <div className="location-coordinates">
        {location.lat != null
          ? `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`
          : "Location unavailable"}
      </div>
    </div>

        <>
    <input
        type="file"
        accept="image/*"
        hidden
        id="avatar"
        onChange={handleAvatarUpload}
    />

    <label
        htmlFor="avatar"
        className="drawer-item"
    >
        Change Avatar
    </label>
    </>

  </div>

  <div className="drawer-bottom">

    <button className="drawer-item" onClick={() => navigate("/about")}>
      About Spotly
    </button>

    <button
      className="drawer-item logout"
      onClick={onLogout}
    >
      Logout
    </button>

  </div>

</aside>

    </div>
  );
}