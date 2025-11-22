// 1. Змінюємо імпорт fs, щоб використовувати promises API
const fs = require("fs").promises;
const path = require("path");
const router = require("express").Router();

// Робимо обробник роута асинхронним
router.post("/report", async (req, res, next) => {
	// ↑ Додали async

	try {
		const { message, ...meta } = req.body || {};
		if (!message || !String(message).trim()) {
			return res.status(400).json({ error: "Message is required" });
		}
		const record = {
			message: String(message).slice(0, 10000),
			meta,
			ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
			at: new Date().toISOString(),
		};

		const logsDir = path.join(__dirname, "..", "logs");

		// 2. Використовуємо await fs.mkdir (асинхронно)
		await fs.mkdir(logsDir, { recursive: true });

		// 3. Використовуємо await fs.appendFile (асинхронно)
		await fs.appendFile(
			path.join(logsDir, "support-reports.jsonl"),
			JSON.stringify(record) + "\n"
		);

		res.json({ ok: true });
	} catch (e) {
		// 4. Якщо виникла помилка, передаємо її далі
		next(e);
	}
});

module.exports = router;
