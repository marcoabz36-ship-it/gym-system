const cors = require("cors");
const express = require("express");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const clientesRoutes = require("./routes/clientes");
const dashboardRoutes = require("./routes/dashboard");
const productosRoutes = require("./routes/productos");
const ventasRoutes = require("./routes/ventas");
const { requireAuth } = require("./middleware/auth");

const app = express();
const port = Number(process.env.PORT || 3000);
const publicPath = path.join(__dirname, "..", "public");

const localOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];
const configuredOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...configuredOrigins, ...localOrigins]);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origen no permitido por CORS."));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.static(publicPath));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/login", authRoutes);
app.use("/api/login", authRoutes);

app.use("/clientes", requireAuth, clientesRoutes);
app.use("/ventas", requireAuth, ventasRoutes);
app.use("/dashboard", requireAuth, dashboardRoutes);
app.use("/productos", requireAuth, productosRoutes);

app.use("/api/clientes", requireAuth, clientesRoutes);
app.use("/api/ventas", requireAuth, ventasRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/productos", requireAuth, productosRoutes);

app.get(["/", "/admin"], (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada." });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = status === 500 ? "No se pudo completar la accion." : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`Sistema de gimnasio listo en http://localhost:${port}`);
});