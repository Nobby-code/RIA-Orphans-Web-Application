const dns = require("dns");
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();
// Set DNS servers to Google's and Cloudflare's public DNS servers
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mpesaRoutes = require("./routes/mpesaRoutes");
const c2bRoutes = require("./routes/c2bRoutes");
const orphanRoutes = require("./routes/orphanRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const widowRoutes = require("./routes/widowRoutes");
const donorsRoutes = require("./routes/donorRoutes");
const userRoutes = require("./routes/userRoutes");
const programRoutes = require("./routes/programRoutes");
const eventsRoutes = require("./routes/eventRoutes");

const mongoose = require("mongoose");

// MongoDB URI
const MONGO_URI =
  process.env.MONGO_URI 
  // || process.env.MONGO_URI_LOCAL;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGO_URI_LOCAL;
    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined in environment variables.");
    }
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected ✅");
  } catch (err) {
    console.error("MongoDB Connection Error ❌ :", err);
  }
};
connectDB();

// mongoose
//   .connect(MONGO_URI)
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

app.use(helmet());

// SECURITY: CORS was wide open ("*") with credentials: true, which is an
// unsafe combination in browsers. Restrict it to known origins via env var:
//   ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser tools (curl, Postman) and same-origin requests with no Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
if (allowedOrigins.length === 0) {
  console.warn(
    "⚠️  ALLOWED_ORIGINS is not set — CORS is currently open to any origin. Set it in .env before deploying to production."
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic global rate limit to slow down abuse/scraping across the API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.use("/api/mpesa", mpesaRoutes);
app.use("/api/mpesa/c2b", c2bRoutes);
app.use("/api/orphans", orphanRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/widows", widowRoutes);
app.use("/api/donors", donorsRoutes);
app.use("/api/donations", mpesaRoutes);
app.use("/api/users", userRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/events", eventsRoutes);
// app.use("/uploads", express.static("uploads"));
// Serve the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("M-Pesa Backend Running");
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length === 0 ? "*" : allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// Make Socket.IO instance available in routes/controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join a room for a specific transaction
  socket.on("joinPaymentRoom", (checkoutRequestID) => {
    socket.join(checkoutRequestID);
    console.log(`Socket ${socket.id} joined room ${checkoutRequestID}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.set("io", io);
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
