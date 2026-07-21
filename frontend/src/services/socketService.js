import { API_BASE } from "./api";
let socket;
let reconnectTimer;
let shouldReconnect = true;
const WS_BASE = API_BASE.replace(/^http/, "ws");
const messageListeners = new Set();

function notifyMessageListeners(event) {
  for (const listener of messageListeners) {
    listener(event);
  }
}

export function connectSocket() {
  shouldReconnect = true;

  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return socket;
  }

  socket = new WebSocket(WS_BASE);

  socket.onopen = () => {
    console.log("Connected");
  };

  socket.onmessage = notifyMessageListeners;

  socket.onclose = () => {
    console.log("Disconnected");
    socket = null;

    if (shouldReconnect && messageListeners.size > 0) {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        connectSocket();
      }, 2000);
    }
  };

  return socket;
}

export function getSocket() {
  return socket;
}

export function subscribeToSocketMessages(listener) {
  messageListeners.add(listener);
  connectSocket();

  return () => {
    messageListeners.delete(listener);
  };
}

export function disconnectSocket() {
  shouldReconnect = false;
  clearTimeout(reconnectTimer);

  if (socket) {
    socket.close();
    socket = null;
  }
}
