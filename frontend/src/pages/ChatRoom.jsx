import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoomMessages } from "../services/roomService";
import "../chat.css";
import { API_BASE } from "../services/api";

export default function ChatRoom({ user, setDeletedRoom }) {
  const { roomName } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);


  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const WS_BASE = API_BASE.replace(/^http/, "ws");

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await getRoomMessages(roomName);
        setMessages(data.messages || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadMessages();
  }, [roomName]);

  useEffect(() => {
    const socket = new WebSocket(WS_BASE);

    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);

      socket.send(
        JSON.stringify({
          type: "subscribe",
          roomName,
        })
      );
    };



    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      switch (payload.type) {
        case "connected":
          break;

        case "subscribed":
          break;

        case "message":
          setMessages((prev) => [...prev, payload.message]);
          break;

        case "error":
          alert(payload.message);
          break;
        
        case "rooms_changed":
          if(
            payload.action === "room_deleted" &&
            payload.roomName === roomName
          ) {
            setDeletedRoom({
              title: "Room unavailable",
              message: "This room no longer exists.",
              redirect: true,
            });
          }
          break;

        default:
          break;
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => socket.close();
  }, [roomName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function sendMessage() {
    if (!text.trim()) return;
    if (socketRef.current?.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        roomName,
        text,
      })
    );

    setText("");
  }

    const discussion = messages.find(
      (m) => m.isQuestion === "true"
    );

    const chatMessages = messages.filter(
      (m) => m.isQuestion !== "true"
    );

  return (
    <div className="chat-page panel">
      <header className="chat-header">
        <button className="back-button" onClick={() => navigate("/")} aria-label="Back to home">
          &larr;
        </button>

        <div className="chat-title">
          <div className="eyebrow">Room</div>
          <h2>{roomName}</h2>
        </div>

        <span className={connected ? "connection-pill online" : "connection-pill offline"}>
          {connected ? "Online" : "Offline"}
        </span>
      </header>
      
      <div className="messages">

        {discussion && (
          <div className="pinned-question">
            <div className="pinned-author">
              {discussion.username}
            </div>

            <div className="pinned-text">
              📌 {discussion.text}
            </div>        
          </div>
        )}

        {chatMessages.length === 0 && (
          <div className="empty-chat">
            No replies yet.
          </div>
        )}

        {chatMessages.map((msg) => {

          const isMine = msg.userId === user?.userId;

          const author = isMine ? "You" : msg.username;

          return (
            <div
              className={isMine ? "message-row mine" : "message-row"}
              key={msg.id}
            >
              <div className="message-bubble">

                <div className="message-header">

                  {msg.avatar ? (
                    <img
                      src={`${API_BASE}/${msg.avatar}`}
                      className="chat-avatar"
                      alt={author}
                    />
                  ) : (
                    <div className="chat-avatar-placeholder">
                      {author[0].toUpperCase()}
                    </div>
                  )}

                  <span className="message-user">
                    {author}
                  </span>

                </div>

                <div className="message-text">
                  {msg.text}
                </div>

                <div className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />

      </div>

      <div className="chat-input">
        <input
          value={text}
          placeholder="Type message..."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button className="primary" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
