const router = require("express").Router();
const { fetchTraffic } = require("../src/services/tomtom.service");
const { cities } = require("../src/utils/cities");


router.get("/:city", async (req, res, next) => {
	try {
		const key = String(req.params.city || "").toLowerCase();
		const coords = cities[key];
		if (!coords) {
			return res
				.status(400)
				.json({ error: `Координати для ${key} не знайдено` });
		}
		const result = await fetchTraffic(coords);
		res.json(result);
	} catch (e) {
		next(e);
	}
});

router.get("/compare", async (req, res, next) => {
	try {
		const list = String(req.query.cities || "")
			.split(",")
			.map((s) => s.trim().toLowerCase())
			.filter(Boolean);

		if (!list.length) {
			return res.status(400).json({ error: "Потрібен параметр cities" });
		}

		const out = {};
		for (const c of list) {
			const coords = cities[c];
			out[c] = coords
				? await fetchTraffic(coords)
				: { error: `Координати для ${c} не знайдено` };
		}
		res.json(out);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
