// frontend/src/utils/helpers.js

export function makeWeatherUrl(lat, lng, apiKey) {
  return (
    "https://api.openweathermap.org/data/2.5/forecast?" +
    new URLSearchParams({
      lat,
      lon: lng,
      units: "metric",
      lang: "uk",
      appid: apiKey,
    })
  ).toString();
}

// Тут можуть бути й інші хелпери
