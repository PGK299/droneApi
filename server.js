require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const cors = require("cors");

// ENV
const { PORT = 3000, CONFIG_SERVER_URL, LOG_URL, LOG_API_TOKEN } = process.env;
if (!CONFIG_SERVER_URL || !LOG_URL || !LOG_API_TOKEN) {
  console.error("[BOOT] Missing ENV variables.");
  process.exit(1);
}

app.use(
  cors({
    origin: ["http://localhost:5173", "*"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "drone-api", ts: new Date().toISOString() });
});

// GET /configs/:droneId
app.get("/configs/:droneId", async (req, res) => {
  try {
    const droneId = String(req.params.droneId).trim();
    const { data } = await axios.get(CONFIG_SERVER_URL);

    const configs = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : [];

    const found = configs.find((c) => String(c.drone_id).trim() === droneId);

    if (!found)
      return res.status(404).json({ message: "drone config not found" });

    res.json({
      drone_id: found.drone_id,
      drone_name: found.drone_name,
      light: found.light,
      country: found.country,
      weight: found.weight,
    });
  } catch (err) {
    console.error(
      "[GET /configs/:droneId] error:",
      err?.response?.data || err.message
    );
    res.status(502).json({ message: "upstream config server error" });
  }
});

// GET /status/:droneId
app.get("/status/:droneId", async (req, res) => {
  try {
    const droneId = String(req.params.droneId).trim();
    const { data } = await axios.get(CONFIG_SERVER_URL);

    const configs = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : [];

    const found = configs.find((c) => String(c.drone_id).trim() === droneId);

    if (!found)
      return res.status(404).json({ message: "drone status not found" });

    res.json({ condition: found.condition ?? "unknown" });
  } catch (err) {
    console.error(
      "[GET /status/:droneId] error:",
      err?.response?.data || err.message
    );
    res.status(502).json({ message: "upstream config server error" });
  }
});

// GET /logs/:droneId
app.get("/logs/:droneId", async (req, res) => {
  try {
    const droneId = String(req.params.droneId).trim();

    const params = new URLSearchParams({
      filter: `(drone_id=${droneId})`,
      sort: "-created",
      perPage: "12",
      page: req.query.page ? String(req.query.page) : "1",
    });

    const { data } = await axios.get(`${LOG_URL}?${params}`, {
      headers: { Authorization: `Bearer ${LOG_API_TOKEN}` },
    });

    const items = Array.isArray(data?.items) ? data.items : [];

    res.json(
      items.map((it) => ({
        drone_id: it.drone_id,
        drone_name: it.drone_name,
        created: it.created,
        country: it.country,
        celsius: it.celsius,
      }))
    );
  } catch (err) {
    console.error(
      "[GET /logs/:droneId] error:",
      err?.response?.data || err.message
    );
    res.status(502).json({ message: "upstream log server error" });
  }
});

// POST /logs
app.post("/logs", async (req, res) => {
  try {
    const { drone_id, drone_name, country, celsius } = req.body;
    if (!drone_id || !drone_name || !country || Number.isNaN(Number(celsius))) {
      return res.status(400).json({ message: "invalid payload" });
    }

    const payload = { drone_id, drone_name, country, celsius: Number(celsius) };

    const { data } = await axios.post(LOG_URL, payload, {
      headers: { Authorization: `Bearer ${LOG_API_TOKEN}` },
    });

    res.status(201).json({
      id: data?.id,
      created: data?.created,
      ...payload,
    });
  } catch (err) {
    console.error("[POST /logs] error:", err?.response?.data || err.message);
    res
      .status(err?.response?.status || 502)
      .json({ message: "upstream log server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[BOOT] drone-api is live on :${PORT}`);
});
