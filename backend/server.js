require("dotenv").config();
const express = require("express");
const cors = require("cors");

const supportRoutes = require("./routes/support.routes");
const trafficRoutes = require("./routes/traffic.routes");
const errorHandler = require("./middlewares/error");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.status(200).send("ok"));
app.get("/api/health", (req, res) => res.status(200).send("ok-api"));

app.use("/api/traffic", trafficRoutes);
app.use("/api/support", supportRoutes);

app.use((req, res) => res.status(404).json({ error: "Not Found" }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`✅ API сервер запущено: http://localhost:${PORT}`);
});
