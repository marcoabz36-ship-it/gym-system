const router = require("express").Router();
const { query, refreshClientStatuses } = require("../db");
const { addMonths, statusFromEndDate, todayISO, toDateTime } = require("../utils/dates");

function parseClient(body, current = {}) {
  const next = {
    nombre: body.nombre ?? current.nombre,
    telefono: body.telefono ?? current.telefono ?? "",
    fecha_inicio: body.fecha_inicio ?? current.fecha_inicio,
    fecha_fin: body.fecha_fin ?? current.fecha_fin
  };

  return {
    ...next,
    estado: statusFromEndDate(next.fecha_fin)
  };
}

router.get("/", async (req, res, next) => {
  try {
    await refreshClientStatuses();

    const search = (req.query.search || "").trim();
    const params = [];
    let where = "";

    if (search) {
      where = "WHERE nombre LIKE ? OR telefono LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    const clients = await query(
      `
        SELECT
          id,
          nombre,
          telefono,
          DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
          DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin,
          estado
        FROM clientes
        ${where}
        ORDER BY estado ASC, fecha_fin ASC, nombre ASC
      `,
      params
    );

    return res.json(clients);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const client = parseClient(req.body);

    if (!client.nombre || !client.fecha_inicio || !client.fecha_fin) {
      return res.status(400).json({ message: "Nombre, inicio y vencimiento son obligatorios." });
    }

    const result = await query(
      `
        INSERT INTO clientes (nombre, telefono, fecha_inicio, fecha_fin, estado)
        VALUES (?, ?, ?, ?, ?)
      `,
      [client.nombre, client.telefono, client.fecha_inicio, client.fecha_fin, client.estado]
    );

    return res.status(201).json({ id: result.insertId, ...client });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const rows = await query(
      `
        SELECT
          id,
          nombre,
          telefono,
          DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
          DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin
        FROM clientes
        WHERE id = ?
      `,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    const client = parseClient(req.body, rows[0]);

    await query(
      `
        UPDATE clientes
        SET nombre = ?, telefono = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?
        WHERE id = ?
      `,
      [client.nombre, client.telefono, client.fecha_inicio, client.fecha_fin, client.estado, req.params.id]
    );

    return res.json({ id: Number(req.params.id), ...client });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM clientes WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/renovar", async (req, res, next) => {
  try {
    const rows = await query(
      `
        SELECT
          id,
          nombre,
          DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin
        FROM clientes
        WHERE id = ?
      `,
      [req.params.id]
    );

    const client = rows[0];
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    const months = Math.max(1, Number(req.body.meses || 1));
    const paymentDate = req.body.fecha || todayISO();
    const baseDate = client.fecha_fin && client.fecha_fin >= paymentDate ? client.fecha_fin : paymentDate;
    const newEndDate = addMonths(baseDate, months);
    const price = Number(req.body.precio || process.env.MEMBERSHIP_PRICE || 80);
    const product = `Membresia ${months} mes${months > 1 ? "es" : ""}`;

    await query(
      "UPDATE clientes SET fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?",
      [paymentDate, newEndDate, statusFromEndDate(newEndDate), req.params.id]
    );

    const sale = await query(
      `
        INSERT INTO ventas (cliente_id, producto, precio, tipo, fecha)
        VALUES (?, ?, ?, 'membresia', ?)
      `,
      [req.params.id, product, price, toDateTime(paymentDate)]
    );

    return res.json({
      cliente_id: Number(req.params.id),
      nombre: client.nombre,
      fecha_inicio: paymentDate,
      fecha_fin: newEndDate,
      estado: statusFromEndDate(newEndDate),
      venta_id: sale.insertId,
      precio: price
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
