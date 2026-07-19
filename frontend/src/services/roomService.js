import { API_BASE, fetchJson } from "./api.js";

export function getRooms() {
  return fetchJson(`${API_BASE}/api/rooms`);
}

export function getNearbyRooms(lat, lon, radius) {
  return fetchJson(`${API_BASE}/api/rooms/nearby?lat=${lat}&lon=${lon}&radius_m=${radius}`);
}

export function updateLocation(lat, lon) {
  return fetchJson(`${API_BASE}/api/rooms/location`, {
    method: "POST",
    body: JSON.stringify({ lat, lon }),
  });
}

export function createRoom(payload) {
  return fetchJson(`${API_BASE}/api/rooms/create`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function joinRoom(roomName) {
  return fetchJson(`${API_BASE}/api/rooms/join`, {
    method: "POST",
    body: JSON.stringify({ roomName }),
  });
}

export function getRoomMessages(roomName) {
  return fetchJson(
    `${API_BASE}/api/rooms/${encodeURIComponent(roomName)}/messages`
  );
}