import { API_BASE, fetchJson } from "./api.js";

export function authMe() {
  return fetchJson(`${API_BASE}/api/auth/me`);
}

// Send OTP (Signup only)
export function requestOtp(email) {
  return fetchJson(`${API_BASE}/api/auth/otp/request`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function signup(
  username,
  displayName,
  email,
  password,
  otp
) {
  return fetchJson(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    body: JSON.stringify({
      username,
      displayName,
      email,
      password,
      otp,
    }),
  });
}

// Login using email & password
export function login(email, password) {
  return fetchJson(`${API_BASE}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function logout() {
  return fetchJson(`${API_BASE}/api/auth/logout`, {
    method: "POST",
  });
}

export async function uploadAvatar(formData) {
    const response = await fetch(
        `${API_BASE}/api/auth/avatar`,
        {
            method: "POST",
            credentials: "include",
            body: formData,
        }
    );

    if (!response.ok) {
        throw new Error("Avatar upload failed");
    }

    return response.json();
}

export async function requestPasswordResetOtp(email) {
  return fetchJson(
    `${API_BASE}/api/auth/forgot-password`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  );
}

export async function resetPassword(
  email,
  otp,
  newPassword
) {
  return fetchJson(
    `${API_BASE}/api/auth/reset-password`,
    {
      method: "POST",
      body: JSON.stringify({
        email,
        otp,
        newPassword,
      }),
    }
  );
}

export function checkUsername(username) {
  return fetchJson(
    `${API_BASE}/api/auth/check-username?username=${encodeURIComponent(username)}`
  );
}

export function checkEmail(email) {
  return fetchJson(
    `${API_BASE}/api/auth/check-email?email=${encodeURIComponent(email)}`
  );
}