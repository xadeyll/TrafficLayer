const axios = require("axios");
const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

async function fetchTraffic({ lat, lng }) {
	const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${TOMTOM_API_KEY}&point=${lat},${lng}`;
	const { data } = await axios.get(url);
	const seg = data.flowSegmentData;
	return {
		averageSpeed: seg.currentSpeed,
		congestionLevel: (1 - seg.currentSpeed / seg.freeFlowSpeed) * 100,
		rawData: seg,
	};
}

module.exports = { fetchTraffic };
