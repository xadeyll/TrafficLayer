const fs = require("fs");
const path = require("path");
const router = require("express").Router();

router.post("/report", (req, res, next) => {
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
		fs.mkdirSync(logsDir, { recursive: true });
		fs.appendFileSync(
			path.join(logsDir, "support-reports.jsonl"),
			JSON.stringify(record) + "\n"
		);

		res.json({ ok: true });
	} catch (e) {
		next(e);
	}
});

module.exports = router;
