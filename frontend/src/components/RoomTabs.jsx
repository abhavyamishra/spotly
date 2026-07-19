import { useState } from "react";
import RoomList from "./RoomList";

export default function RoomTabs({
  nearby,
  created,
  joined,
  onJoin,
  onOpen,
  locationReady,
}) {
  const [activeTab, setActiveTab] = useState("nearby");

  return (
    <section className="rooms-card">
      <div className="rooms-header">
        <div>Rooms</div>

        <div className="room-tabs">
          <button
            className={activeTab === "nearby" ? "room-tab tab active" : "room-tab"}
            onClick={() => setActiveTab("nearby")}
          >
            Nearby ({nearby.length})
          </button>

          <button
            className={activeTab === "created" ? "room-tab active" : "room-tab"}
            onClick={() => setActiveTab("created")}
          >
            Your Rooms ({created.length})
          </button>

          <button
            className={activeTab === "joined" ? "room-tab active" : "room-tab"}
            onClick={() => setActiveTab("joined")}
          >
            Joined ({joined.length})
          </button>
        </div>
      </div>

      <div className="rooms-scroll">
        {activeTab === "nearby" && (
          <RoomList
            rooms={nearby}
            title=""
            eyebrow=""
            tone="discover"
            isNearby
            onJoin={onJoin}
            emptyMessage={
              locationReady
                ? "No nearby rooms available."
                : "Location permission required."
            }
          />
        )}

        {activeTab === "created" && (
          <RoomList
            rooms={created}
            title=""
            eyebrow=""
            tone="owned"
            onOpen={onOpen}
            emptyMessage="You haven't created any rooms yet."
          />
        )}

        {activeTab === "joined" && (
          <RoomList
            rooms={joined}
            title=""
            eyebrow=""
            tone="joined"
            onOpen={onOpen}
            emptyMessage="You haven't joined any rooms yet."
          />
        )}
      </div>
    </section>
  );
}