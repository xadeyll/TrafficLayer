# 🚦 Traffic Analyzer

Веб-додаток для аналізу трафіку в різних містах з використанням **TomTom API**, **Google Maps** та **OpenWeather**.  
Проєкт складається з **frontend (React + Vite)** та **backend (Node.js + Express)**.

---

## 📂 Структура проєкту

coursework/
├── backend/ # сервер (Express, API, логіка)
│ ├── index.js # головний вхідний файл бекенду
│ ├── logs/ # логи помилок та звітів
│ └── .env # ключі та налаштування бекенду
│
├── frontend/ # клієнтська частина (React + Vite)
│ ├── src/
│ │ ├── App.jsx # головний компонент React
│ │ └── components/data/countries.json # координати міст
│ └── .env # ключі для Vite (Google Maps, Weather)
│
├── docker-compose.yml # конфіг для Docker
└── README.md # документація

yaml
Копировать код

---

## ⚙️ Налаштування

### 1. Root `.env`

У корені проєкту створіть файл `.env`:

```env
VITE_GOOGLE_MAPS_KEY=your_google_maps_key_here
VITE_OPENWEATHER_KEY=your_openweather_key_here
2. Backend .env
У backend/.env:

env
Копировать код
PORT=5000
TOMTOM_API_KEY=your_tomtom_api_key_here
NODE_ENV=development
🚀 Запуск
🔹 Локально (без Docker)
Встановіть залежності:

bash
Копировать код
cd backend && npm install
cd ../frontend && npm install
Запустіть бекенд:

bash
Копировать код
cd backend
npm start
Бекенд працюватиме на: http://localhost:5000

Запустіть фронтенд:

bash
Копировать код
cd frontend
npm run dev
Фронтенд буде доступний на: http://localhost:5173

🔹 Через Docker Compose
Збірка та запуск:

bash
Копировать код
docker compose up --build
Фронтенд: http://localhost:8080
Бекенд: http://localhost:5000

Зупинка:

bash
Копировать код
docker compose down
📜 Логи
Логи бекенду (backend/logs/errors.log):

bash
Копировать код
tail -f backend/logs/errors.log
Звіти користувачів (backend/logs/support-reports.jsonl):

bash
Копировать код
# використовуйте інструменти для перегляду файлу в каталозі backend/logs
✨ Можливості
Вибір міста → отримання даних про трафік через TomTom API.

Інтерактивна карта (Google Maps) з шаром трафіку.

Погода (OpenWeather API) для вибраного міста.

Надсилання повідомлення про помилку (логування в консоль/файл).

Запуск у Docker або напряму з Node.js.

📌 Основні команди Docker
docker compose up -d — запуск у фоні

docker compose up --build - запуск

docker compose down — зупинка

docker compose logs -f — перегляд логів

docker exec -it traffic-backend bash — зайти в контейнер бекенду

docker system prune -a — очистка непотрібного
```
