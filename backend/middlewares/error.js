const isDev = process.env.NODE_ENV !== "production";

module.exports = (err, req, res, next) => {
	if (res.headersSent) return next(err);

	const status = err.status || err.statusCode || err.response?.status || 500;

	const ext = err.response?.data || err.data || undefined;

	if (isDev) {
		console.error("[ERROR]", err.message);
		if (ext) console.error("[ERROR][data]", ext);
		if (err.stack) console.error(err.stack);
	} else {
		console.error("[ERROR]", err.message);
	}

	// fallback на 500, якщо не встановлено
	if (!res.statusCode || res.statusCode < 400) res.status(status);

	const payload = isDev
		? { error: err.message || "Internal Server Error", details: ext }
		: { error: "Internal Server Error" };

	res.status(status).json(payload);
};
