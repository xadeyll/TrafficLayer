import {
	GoogleMap,
	TrafficLayer,
	useJsApiLoader,
} from "@react-google-maps/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import countries from "./components/data/countries.json";
import "./components/styles/App.css";
import Modal from "./components/ui/Modal.jsx";

function useDebounced(fn, delay = 500) {
	const timerRef = useRef(null);
	const controllerRef = useRef(null);

	const debounced = useCallback(
		(...args) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			if (controllerRef.current) controllerRef.current.abort();

			const controller = new AbortController();
			controllerRef.current = controller;

			timerRef.current = setTimeout(() => {
				fn(controller.signal, ...args);
			}, delay);
		},
		[fn, delay]
	);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			if (controllerRef.current) controllerRef.current.abort();
		};
	}, []);

	return debounced;
}
const darkStyle = [
	{ elementType: "geometry", stylers: [{ color: "#1D232A" }] },
	{ elementType: "labels.text.fill", stylers: [{ color: "#E5E7EB" }] },
	{ elementType: "labels.text.stroke", stylers: [{ color: "#111827" }] },
	{
		featureType: "road",
		elementType: "geometry",
		stylers: [{ color: "#374151" }],
	},
	{
		featureType: "water",
		elementType: "geometry",
		stylers: [{ color: "#0B1220" }],
	},
	{ featureType: "poi", stylers: [{ visibility: "off" }] },
];
const lightStyle = [
	{ elementType: "geometry", stylers: [{ color: "#F5F7FB" }] },
	{ elementType: "labels.text.fill", stylers: [{ color: "#0F172A" }] },
	{
		featureType: "road",
		elementType: "geometry",
		stylers: [{ color: "#E5E7EB" }],
	},
];

function makeLinks(lat, lng) {
	return [
		{
			href: `https://www.google.com/maps?q=${lat},${lng}`,
			emoji: "🗺️",
			label: "Google Maps",
		},
		{
			href: `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`,
			emoji: "🚘",
			label: "Waze",
		},
		{
			href: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
			emoji: "🧭",
			label: "OpenStreetMap",
		},
		{
			href: `https://www.windy.com/?${lat},${lng},10`,
			emoji: "🌬️",
			label: "Windy",
		},
	];
}

function Controls({
	country,
	city,
	countries,
	setCountry,
	setCity,
	onAnalyze,
	loading,
}) {
	return (
		<div className="controls-row">
			<label className="field">
				<span className="label">Країна</span>
				<select
					className="select"
					value={country}
					onChange={(e) => {
						const val = e.target.value;
						setCountry(val);
						setCity(Object.keys(countries[val].cities)[0]);
					}}
				>
					{Object.entries(countries).map(([code, c]) => (
						<option key={code} value={code}>
							{c.name}
						</option>
					))}
				</select>
			</label>
			<label className="field">
				<span className="label">Місто</span>
				<select
					className="select"
					value={city}
					onChange={(e) => setCity(e.target.value)}
				>
					{Object.keys(countries[country].cities).map((code) => (
						<option key={code} value={code}>
							{code.toUpperCase()}
						</option>
					))}
				</select>
			</label>
			<button className="btn primary" onClick={onAnalyze} disabled={loading}>
				{loading ? "Аналізую…" : "Аналізувати"}
			</button>
		</div>
	);
}

function Analytics({
	analysis,
	loading,
	error,
	viewMode,
	setViewMode,
	currentDate,
}) {
	return (
		<>
			<div
				className="segmented"
				role="tablist"
				aria-label="Відображення метрик"
			>
				<button
					type="button"
					className={`segmented-btn ${viewMode === "both" ? "active" : ""}`}
					onClick={() => setViewMode("both")}
					role="tab"
					aria-selected={viewMode === "both"}
				>
					Швидкість та затори
				</button>
				<button
					type="button"
					className={`segmented-btn ${viewMode === "speed" ? "active" : ""}`}
					onClick={() => setViewMode("speed")}
					role="tab"
					aria-selected={viewMode === "speed"}
				>
					Лише швидкість
				</button>
				<button
					type="button"
					className={`segmented-btn ${
						viewMode === "congestion" ? "active" : ""
					}`}
					onClick={() => setViewMode("congestion")}
					role="tab"
					aria-selected={viewMode === "congestion"}
				>
					Лише затори
				</button>
			</div>
			{!analysis && !loading && (
				<p className="muted">Натисніть «Аналізувати», щоб отримати метрики.</p>
			)}
			{loading && (
				<p className="muted" aria-live="polite">
					Завантаження…
				</p>
			)}
			{error && (
				<div className="alert" aria-live="polite">
					❌ {error}
				</div>
			)}
			{analysis && !error && (
				<ul className="metrics">
					{(viewMode === "both" || viewMode === "speed") && (
						<li>
							<span>🚗 Середня швидкість</span>
							<b>{analysis.averageSpeed} км/год</b>
						</li>
					)}
					{(viewMode === "both" || viewMode === "congestion") && (
						<li>
							<span>⚠️ Рівень заторів</span>
							<b>{(analysis.congestionLevel ?? 0).toFixed(2)}%</b>
						</li>
					)}
					<li>
						<span>📅 Дата аналізу</span>
						<b>{currentDate}</b>
					</li>
				</ul>
			)}
		</>
	);
}

function Links({ quickLinks }) {
	return (
		<div className="link-buttons">
			{quickLinks.map((l) => (
				<a
					key={l.href}
					className="btn link-btn"
					href={l.href}
					target="_blank"
					rel="noopener noreferrer"
				>
					{l.emoji} {l.label}
				</a>
			))}
		</div>
	);
}

function MapView({
	isLoaded,
	loadError,
	center,
	zoom = 12,
	mapTypeId,
	darkMode,
}) {
	return (
		<div className="map-wrap center-map">
			{loadError && (
				<div>
					<p className="alert">❌ Помилка завантаження Google Maps</p>
					<p className="small muted">
						Перевір ключ та увімкни білінг у Google Cloud → Maps JavaScript API.
					</p>
				</div>
			)}
			{!isLoaded && !loadError && (
				<p className="muted small">Завантажую карту…</p>
			)}
			{isLoaded && (
				<GoogleMap
					mapContainerStyle={{ width: "100%", height: "calc(var(--vh) * 70)" }}
					center={center}
					zoom={zoom}
					mapTypeId={mapTypeId}
					options={{
						clickableIcons: false,
						fullscreenControl: false,
						streetViewControl: false,
						styles: darkMode ? darkStyle : lightStyle,
					}}
				>
					<TrafficLayer autoUpdate />
				</GoogleMap>
			)}
		</div>
	);
}

function WeatherWidget({ weather, weatherError }) {
	return (
		<div className="weather-block">
			<h3 className="weather-title">Прогноз погоди (ближчі години)</h3>
			{weatherError && (
				<p className="alert" aria-live="polite">
					⚠️ {weatherError}
				</p>
			)}{" "}
			{!weather && !weatherError && (
				<p className="muted small" aria-live="polite">
					Завантажую прогноз…
				</p>
			)}
			{weather && (
				<div className="weather-row">
					{weather.list.map((item) => (
						<div className="weather-item" key={item.dt}>
							<div className="w-time">{item.time}</div>
							<img
								className="w-icon"
								src={`https://openweathermap.org/img/wn/${item.icon}@2x.png`}
								alt={item.desc}
								loading="lazy"
							/>
							<div className="w-temp">{item.temp}°C</div>
							<div className="w-desc">{item.desc}</div>
							<div className="w-wind">вітр {item.wind} м/с</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

const api = {
	get: async (url, config = {}) => {
		const u = new URL(url, window.location.origin);
		if (config.params) {
			Object.entries(config.params).forEach(([k, v]) =>
				u.searchParams.set(k, v)
			);
		}
		const res = await fetch(u.toString(), {
			method: "GET",
			signal: config.signal,
			headers: { "Content-Type": "application/json" },
		});
		if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
		return { data: await res.json() };
	},
	post: async (url, payload = {}) => {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
		return { data: await res.json() };
	},
};
async function sendSupportReport(payload) {
	return await api.post(`/api/support/report`, payload);
}

async function getTrafficAnalysis(city, signal) {
	const { data } = await api.get(`/api/traffic/${city}`, { signal });
	return data;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 хв

async function getWeather(lat, lng, signal) {
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

	const res = await fetch(
		"https://api.openweathermap.org/data/2.5/forecast?" +
			new URLSearchParams({
				lat,
				lon: lng,
				units: "metric",
				lang: "uk",
				appid: OPENWEATHER_KEY,
			}),
		{ signal }
	);
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

function openMailClient(subject, body) {
	window.location.href = `mailto:support@example.com?subject=${encodeURIComponent(
		subject
	)}&body=${encodeURIComponent(body)}`;
}

export default function App() {
	const [country, setCountry] = useState("UA");
	const [city, setCity] = useState("kyiv");
	const [analysis, setAnalysis] = useState(null);
	const [loading, setLoading] = useState(false);
	const [mapType, setMapType] = useState("roadmap");
	const [error, setError] = useState("");
	const [darkMode, setDarkMode] = useState(true);
	const [viewMode, setViewMode] = useState("both");
	const [weather, setWeather] = useState(null);
	const [weatherError, setWeatherError] = useState("");

	const [supportOpen, setSupportOpen] = useState(false);
	const [supportText, setSupportText] = useState("");
	const [supportSending, setSupportSending] = useState(false);
	const [supportMsg, setSupportMsg] = useState("");

	const [termsOpen, setTermsOpen] = useState(false);
	const [privacyOpen, setPrivacyOpen] = useState(false);
	const [aboutOpen, setAboutOpen] = useState(false);
	const [contactOpen, setContactOpen] = useState(false);

	const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

	useEffect(() => {
		const setVH = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};
		setVH();
		window.addEventListener("resize", setVH);
		return () => window.removeEventListener("resize", setVH);
	}, []);

	const anyModalOpen =
		supportOpen || termsOpen || privacyOpen || aboutOpen || contactOpen;
	useEffect(() => {
		if (anyModalOpen) document.body.classList.add("modal-open");
		else document.body.classList.remove("modal-open");
		return () => document.body.classList.remove("modal-open");
	}, [anyModalOpen]);

	const { isLoaded, loadError } = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: mapsKey || "",
	});
	useEffect(() => {
		if (!mapsKey) console.warn("Відсутній VITE_GOOGLE_MAPS_KEY");
	}, [mapsKey]);

	const mapCenter = useMemo(
		() => countries[country]?.cities?.[city] ?? { lat: 50.45, lng: 30.52 },
		[country, city]
	);
	const quickLinks = useMemo(
		() => makeLinks(mapCenter.lat, mapCenter.lng),
		[mapCenter]
	);

	const [analysisDate, setAnalysisDate] = useState(() => new Date());
	const currentDate = analysisDate.toLocaleString("uk-UA", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	const fetchAnalysisCore = useCallback(
		async (signal) => {
			if (!countries[country]?.cities?.[city]) return;
			setLoading(true);
			setError("");
			setAnalysis(null);
			try {
				const data = await getTrafficAnalysis(city, signal);
				setAnalysis(data);
			} catch (e) {
				if (e?.name === "AbortError") return;
				setError(e?.message || "Не вдалося отримати дані.");
			} finally {
				setLoading(false);
			}
		},
		[country, city]
	);

	const fetchAnalysis = useDebounced((signal) => {
		fetchAnalysisCore(signal);
	}, 500);

	const fetchWeather = useCallback(async (lat, lng, signal) => {
		try {
			const data = await getWeather(lat, lng, signal);
			setWeather(data);
			setWeatherError("");
		} catch (e) {
			if (e.message === "NO_OPENWEATHER_KEY") {
				setWeather(null);
				setWeatherError("Немає VITE_OPENWEATHER_KEY у .env");
				return;
			}
			setWeather(null);
			setWeatherError("Не вдалося завантажити прогноз");
		}
	}, []);

	useEffect(() => {
		setError("");
	}, [country, city]);

	useEffect(() => {
		const c = countries[country]?.cities?.[city];
		if (!c) return;
		const controller = new AbortController();
		fetchWeather(c.lat, c.lng, controller.signal);
		return () => controller.abort();
	}, [country, city, fetchWeather]);

	const submitSupport = async () => {
		if (supportSending) return;
		if (!supportText.trim()) {
			setSupportMsg("Опишіть, будь ласка, проблему.");
			return;
		}
		setSupportSending(true);
		setSupportMsg("");
		try {
			const payload = {
				message: supportText.trim(),
				url: window.location.href,
				userAgent: navigator.userAgent,
				city,
				country,
				mapType,
				timestamp: new Date().toISOString(),
			};
			await sendSupportReport(payload);
			setSupportMsg("Дякуємо! Повідомлення надіслано.");
			setSupportText("");
		} catch {
			const subject = "Звіт про помилку — Traffic Analyzer";
			const body = `URL: ${window.location.href}
UA: ${navigator.userAgent}
Місто: ${city}
Країна: ${country}
Тип карти: ${mapType}

Опис:
${supportText.trim()}`;
			openMailClient(subject, body);
			setSupportMsg("📧 Відкрито поштовий клієнт для надсилання листа.");
		} finally {
			setSupportSending(false);
		}
	};

	return (
		<div className={`app ${darkMode ? "dark" : "light"}`}>
			<header className="app-header">
				<div />
				<div className="brand">
					<span className="dot" />
					<h1>Карта Трафіку</h1>
				</div>
				<div className="header-right">
					<button
						className="icon-btn"
						data-tooltip="Оновити дані"
						onClick={() => {
							setAnalysisDate(new Date());
							fetchAnalysis();
							fetchWeather(mapCenter.lat, mapCenter.lng);
						}}
						aria-label="Оновити дані"
					>
						↻
					</button>

					<button
						className="icon-btn"
						data-tooltip={darkMode ? "Світла тема" : "Темна тема"}
						onClick={() => setDarkMode((d) => !d)}
						aria-label="Перемкнути тему"
					>
						{darkMode ? "🌙" : "☀️"}
					</button>

					<button
						className="icon-btn"
						data-tooltip={mapType === "roadmap" ? "Супутник" : "Схема"}
						onClick={() =>
							setMapType((t) => (t === "roadmap" ? "satellite" : "roadmap"))
						}
						aria-label="Перемкнути тип карти"
					>
						🗺️
					</button>

					<button
						className="icon-btn"
						data-tooltip="Моє місце"
						onClick={() => {
							if (navigator.geolocation) {
								navigator.geolocation.getCurrentPosition(
									(pos) =>
										alert(`📍 Ваші координати:
Широта: ${pos.coords.latitude.toFixed(4)}
Довгота: ${pos.coords.longitude.toFixed(4)}`),
									(err) =>
										alert(
											err.code === 1
												? "⚠️ Ви заборонили доступ до геолокації."
												: err.code === 2
												? "⚠️ Неможливо визначити місце розташування."
												: err.code === 3
												? "⌛ Час очікування вичерпано."
												: "❌ Невідома помилка."
										)
								);
							} else alert("🚫 Ваш браузер не підтримує геолокацію");
						}}
						aria-label="Показати мої координати"
					>
						📍
					</button>

					<button
						className="icon-btn"
						data-tooltip="Повідомити про помилку"
						onClick={() => setSupportOpen(true)}
						aria-label="Відкрити форму підтримки"
					>
						🛟
					</button>
				</div>
			</header>

			<main className="layout">
				<section className="card controls-card">
					<Controls
						country={country}
						city={city}
						countries={countries}
						setCountry={setCountry}
						setCity={setCity}
						onAnalyze={fetchAnalysis}
						loading={loading}
					/>

					<div className="legend">
						<div className="legend-bar" />
						<div className="legend-labels">
							<span>Вільно</span>
							<span>Середньо</span>
							<span>Затори</span>
						</div>
					</div>
				</section>

				<section className="card links-card">
					<h2>Швидкі посилання — {city.toUpperCase()}</h2>
					<Links quickLinks={quickLinks} />
				</section>

				<section className="card analytics-card">
					<h2>Результати аналізу</h2>
					<Analytics
						analysis={analysis}
						loading={loading}
						error={error}
						viewMode={viewMode}
						setViewMode={setViewMode}
						currentDate={currentDate}
					/>

					<WeatherWidget weather={weather} weatherError={weatherError} />
				</section>

				<section className="card map-card">
					<div className="card-head">
						<h2>Карта трафіку — {city.toUpperCase()}</h2>{" "}
						<span className="chip">
							{countries[country]?.cities?.[city]?.info || "—"}
						</span>
					</div>

					<MapView
						isLoaded={isLoaded}
						loadError={loadError}
						center={mapCenter}
						zoom={12}
						mapTypeId={mapType}
						darkMode={darkMode}
					/>
				</section>
			</main>

			<footer className="footer waze">
				<div className="waze-top">
					<div className="waze-brand">
						<h2>Traffic Analyzer</h2>

						<div className="waze-social">
							<a
								href="https://twitter.com"
								aria-label="X / Twitter"
								target="_blank"
								rel="noreferrer"
							>
								<svg viewBox="0 0 24 24" width="22" height="22">
									<path
										fill="currentColor"
										d="M18.244 2H21l-6.51 7.44L22 22h-6.873l-4.6-6.08L5.2 22H2.444l7.02-8L2 2h6.873l4.237 5.6L18.244 2Zm-2.4 18h1.74L8.23 4h-1.7l9.314 16Z"
									/>
								</svg>
							</a>
							<a
								href="https://facebook.com"
								aria-label="Facebook"
								target="_blank"
								rel="noreferrer"
							>
								<svg viewBox="0 0 24 24" width="22" height="22">
									<path
										fill="currentColor"
										d="M22 12a10 10 0 1 0-11.563 9.875v-6.988H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.563V12h2.773l-.443 2.887h-2.33v6.988A10 10 0 0 0 22 12Z"
									/>
								</svg>
							</a>
							<a
								href="https://instagram.com"
								aria-label="Instagram"
								target="_blank"
								rel="noreferrer"
							>
								<svg viewBox="0 0 24 24" width="22" height="22">
									<path
										fill="currentColor"
										d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Zm5.25-2.5a1 1 0 1 1 0 2a1 1 0 0 1 0-2Z"
									/>
								</svg>
							</a>
							<a
								href="https://youtube.com"
								aria-label="YouTube"
								target="_blank"
								rel="noreferrer"
							>
								<svg viewBox="0 0 24 24" width="22" height="22">
									<path
										fill="currentColor"
										d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.6 4.5 12 4.5 12 4.5s-7.6 0-9.4.6A3 3 0 0 0 .5 7.2 31.1 31.1 0 0 0 0 12a31.1 31.1 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.1 31.1 0 0 0 24 12a31.1 31.1 0 0 0-.5-4.8ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z"
									/>
								</svg>
							</a>
						</div>
					</div>

					{/* ПРАВА КОЛОНКА */}
					<nav className="waze-col">
						<h4>Інформація</h4>
						<ul>
							<li>
								<button
									type="button"
									className="linklike-btn"
									onClick={() => setAboutOpen(true)}
								>
									Про нас
								</button>
							</li>
							<li>
								<button
									type="button"
									className="linklike-btn"
									onClick={() => setContactOpen(true)}
								>
									Звʼязатися з нами
								</button>
							</li>
						</ul>
					</nav>
				</div>

				<div className="waze-bottom">
					<p>© 2025 Traffic Analyzer. Всі права захищені.</p>
					<div className="waze-links">
						<button
							type="button"
							className="linklike-btn"
							onClick={() => setTermsOpen(true)}
						>
							Умови використання
						</button>
						<button
							type="button"
							className="linklike-btn"
							onClick={() => setPrivacyOpen(true)}
						>
							Політика конфіденційності
						</button>
					</div>
				</div>
			</footer>

			{supportOpen && (
				<Modal
					title="Повідомити про помилку"
					onClose={() => setSupportOpen(false)}
					footer={
						<>
							<button className="btn" onClick={() => setSupportOpen(false)}>
								Скасувати
							</button>
							<button
								className="btn primary"
								onClick={submitSupport}
								disabled={supportSending}
							>
								{supportSending ? "Надсилаю…" : "Надіслати"}
							</button>
						</>
					}
				>
					<label className="field">
						<span className="label">Опишіть проблему</span>
						<textarea
							className="textarea"
							rows={5}
							placeholder="Що саме пішло не так? Кроки для відтворення, очікуваний результат, посилання на скріншоти тощо."
							value={supportText}
							onChange={(e) => setSupportText(e.target.value)}
						/>
					</label>
					{supportMsg && <p className="muted small">{supportMsg}</p>}
				</Modal>
			)}

			{termsOpen && (
				<Modal
					title="Умови використання"
					onClose={() => setTermsOpen(false)}
					footer={
						<button className="btn" onClick={() => setTermsOpen(false)}>
							Закрити
						</button>
					}
				>
					<p>
						Використовуючи сервіс <b>Traffic Analyzer</b>, ви погоджуєтесь з
						тим, що інформація надається «як є». Адміністрація не гарантує
						абсолютну точність або безперервність роботи сервісу.
					</p>
					<p>
						Заборонено використовувати сервіс для протиправної діяльності,
						перевантажувати інфраструктуру, здійснювати зворотну інженерію,
						копіювання або несанкціонований перепродаж.
					</p>
					<p>
						Ми можемо періодично змінювати ці умови. Актуальна версія доступна
						безпосередньо в застосунку.
					</p>
				</Modal>
			)}

			{privacyOpen && (
				<Modal
					title="Політика конфіденційності"
					onClose={() => setPrivacyOpen(false)}
					footer={
						<button className="btn" onClick={() => setPrivacyOpen(false)}>
							Закрити
						</button>
					}
				>
					<p>
						Ми поважаємо вашу конфіденційність. <b>Traffic Analyzer</b> не
						зберігає персональні дані поза необхідними технічними логами. Вибір
						міста, режим карти та технічні події можуть зберігатися локально у
						вашому браузері.
					</p>
					<p>
						Під час використання інтеграцій Google Maps та OpenWeather, дані про
						місце розташування та запити можуть оброблятися цими сервісами
						згідно з їх власними політиками.
					</p>
					<p>
						Якщо у вас є питання щодо приватності — напишіть нам:{" "}
						<a href="mailto:support@example.com">support@example.com</a>.
					</p>
				</Modal>
			)}

			{aboutOpen && (
				<Modal
					title="Про нас"
					onClose={() => setAboutOpen(false)}
					footer={
						<button className="btn" onClick={() => setAboutOpen(false)}>
							Закрити
						</button>
					}
				>
					<p>
						<b>Traffic Analyzer</b> — веб-сервіс для швидкого аналізу дорожнього
						трафіку та відображення його на мапі. Поєднуємо шари трафіку Google
						Maps з прогнозом погоди OpenWeather, щоб допомогти водіям планувати
						поїздки.
					</p>
					<p>
						Мета — надати просту, зручну картину завантаженості міста, середніх
						швидкостей і рівня заторів.
					</p>
					<p>
						Ідеї або баги — пишіть на{" "}
						<a href="mailto:support@example.com">support@example.com</a>.
					</p>
				</Modal>
			)}

			{contactOpen && (
				<Modal
					title="Звʼязатися з нами"
					onClose={() => setContactOpen(false)}
					footer={
						<button className="btn" onClick={() => setContactOpen(false)}>
							Закрити
						</button>
					}
				>
					<p>
						Надішліть нам листа на{" "}
						<a href="mailto:support@example.com">support@example.com</a> або
						скористайтесь формою “Повідомити про помилку”.
					</p>
				</Modal>
			)}
		</div>
	);
}
