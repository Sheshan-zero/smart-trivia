const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "smart-trivia-api", time: new Date().toISOString() });
});

app.get("/api/greeting", (req, res) => {
  res.json({ message: "Hello from Smart Trivia API 👋" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
