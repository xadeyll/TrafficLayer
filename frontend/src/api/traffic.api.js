// frontend/src/api/traffic.api.js
import api from "./http"; // Імпортуємо наш налаштований Axios клієнт
import { makeWeatherUrl } from "../utils/helpers"; // Буде створено на Кроці 3

// 1. Функція для отримання аналізу трафіку
export async function getTrafficAnalysis(city, signal) {
  const response = await api.get(`/traffic/${city}`, { signal });
  return response.data;
}

// 2. Функція для надсилання звіту підтримки
export async function sendSupportReport(payload) {
  const response = await api.post(`/support/report`, payload);
  return response.data;
}

// 3. Функція для отримання погоди (використовує нативний fetch через URL)
const CACHE_TTL = 10 * 60 * 1000;

export async function getWeather(lat, lng, signal) {
  const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY;
  if (!OPENWEATHER_KEY) throw new Error("NO_OPENWEATHER_KEY");

  const key = `weather:${lat}:${lng}`;
  const cached = sessionStorage.getItem(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts < CACHE_TTL) return parsed.data;
    } catch {}
  }

  // Створюємо URL
  const url = makeWeatherUrl(lat, lng, OPENWEATHER_KEY);

  const res = await fetch(url, { signal });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenWeather Error: ${res.statusText}. Details: ${errorText.slice(0, 100)}`);
  }

  const json = await res.json();

  const list = (json?.list ?? []).slice(0, 5).map((x) => ({
    dt: x.dt,
    time: new Date(x.dt * 1000).toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    temp: Math.round(x.main?.temp ?? 0),
    wind: Math.round(x.wind?.speed ?? 0),
    desc: x.weather?.[0]?.description ?? "",
    icon: x.weather?.[0]?.icon ?? "01d",
  }));

  const data = { city: json?.city?.name, list };
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
  return data;
}
