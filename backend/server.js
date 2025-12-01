const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const mpesaRoutes = require("./routes/mpesaRoutes");

const mongoose = require("mongoose");

// MongoDB URI
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/donationsDB";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
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

app.use(cors());
app.use(bodyParser.json());

app.use("/api/mpesa", mpesaRoutes);

app.get("/", (req, res) => {
  res.send("M-Pesa Backend Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
