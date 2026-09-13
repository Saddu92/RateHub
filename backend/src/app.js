const express = require("express");
const cors = require("cors");

const testRoutes = require("./routes/test.routes");
const authRoutes = require("./auth/auth.routes");
const adminRoutes = require("./admin/admin.routes");
const storesRoutes = require("./stores/stores.routes");
const ownerRoutes = require("./owner/owner.routes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://rate-hub-phi.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/admin", adminRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/owner", ownerRoutes);


// API root
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RateHub API is running",
  });
});
app.use("/api/auth", authRoutes);

// Test routes
app.use("/api/test", testRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RateHub API is running 🚀",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
