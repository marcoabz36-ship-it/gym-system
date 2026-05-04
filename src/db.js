const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      error.status = 503;
      error.message = "No se pudo conectar con MySQL. Verifica que el servidor de base de datos este encendido.";
    }

    if (error.code === "ER_BAD_DB_ERROR") {
      error.status = 503;
      error.message = "La base de datos no existe. Ejecuta el script database/schema.sql.";
    }

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      error.status = 503;
      error.message = "MySQL rechazo el usuario o la contrasena configurados en .env.";
    }

    throw error;
  }
}

async function refreshClientStatuses() {
  await query(`
    UPDATE clientes
    SET estado = CASE
      WHEN fecha_fin >= CURDATE() THEN 'activo'
      ELSE 'vencido'
    END
  `);
}

module.exports = {
  pool,
  query,
  refreshClientStatuses
};
