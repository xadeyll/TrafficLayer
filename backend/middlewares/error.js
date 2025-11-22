const isDev = process.env.NODE_ENV !== "production";

module.exports = (err, req, res, next) => {
	if (res.headersSent) return next(err);
	const status = err.status || err.statusCode || err.response?.status || 500;
	const ext = err.response?.data || err.data || undefined;
	console.error(`[ERROR] [${status}] ${err.message}`);
	if (ext) console.error("[ERROR][data]", ext);
	if (isDev && err.stack) console.error(err.stack);
	let errorMessage = "Internal Server Error";
	if (status < 500 && isDev) {
		errorMessage = err.message;
	}
	const payload = {
		error: errorMessage,
	};
	res.status(status).json(payload);
};
