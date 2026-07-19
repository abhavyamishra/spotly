export function getCurrentLocation(options = { enableHighAccuracy: true, timeout: 10000 }) {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("Geolocation is not supported in this browser."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error("Location permission denied or unavailable."));
      },
      options
    );
  });
}
