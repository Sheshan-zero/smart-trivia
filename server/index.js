require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    require("./models/User");
    require("./models/Otp");
    require("./models/Module");
    require("./models/Quiz");
    require("./models/Question");

   
    app.use("/auth", require("./routes/auth"));
    app.use("/admin", require("./routes/admin"));
    app.use("/public", require("./routes/public"));

    app.get("/health", async (req, res) => {
      const dbState = mongoose.connection.readyState; 
      res.json({
        ok: true,
        service: "smart-trivia-api",
        dbConnected: dbState === 1,
        time: new Date().toISOString(),
      });
    });

    app.get("/api/greeting", (req, res) => {
      res.json({ message: "Hello from Smart Trivia API" });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
