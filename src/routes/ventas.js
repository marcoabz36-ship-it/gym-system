const router = require("express").Router();
const { query } = require("../db");
const { toDateTime } = require("../utils/dates");

async function resolveProduct(body) {
  if (body.producto_id) {
    const products = await query(
      "SELECT nombre, precio FROM productos WHERE id = ? AND activo = 1 LIMIT 1",
      [body.producto_id]
    );

    if (!products[0]) {
      const error = new Error("Producto no encontrado.");
      error.status = 404;
      throw error;
    }

    return products[0];
  }

  return {
    nombre: body.producto,
    precio: Number(body.precio)
  };
}

router.get("/", async (req, res, next) => {
  try {
    const where = [];
    const params = [];

    if (req.query.fecha) {
      where.push("DATE(v.fecha) = ?");
      params.push(req.query.fecha);
    }

    if (!req.query.fecha && req.query.mes) {
      where.push("v.fecha >= ? AND v.fecha < DATE_ADD(?, INTERVAL 1 MONTH)");
      params.push(`${req.query.mes}-01`, `${req.query.mes}-01`);
    }

    if (req.query.desde) {
      where.push("DATE(v.fecha) >= ?");
      params.push(req.query.desde);
    }

    if (req.query.hasta) {
      where.push("DATE(v.fecha) <= ?");
      params.push(req.query.hasta);
    }

    if (req.query.tipo) {
      where.push("v.tipo = ?");
      params.push(req.query.tipo);
    }

    const sales = await query(
      `
        SELECT
          v.id,
          v.cliente_id,
          c.nombre AS cliente,
          v.producto,
          v.precio,
          v.tipo,
          DATE_FORMAT(v.fecha, '%Y-%m-%d %H:%i') AS fecha
        FROM ventas v
        LEFT JOIN clientes c ON c.id = v.cliente_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY v.fecha DESC, v.id DESC
        LIMIT 300
      `,
      params
    );

    return res.json(sales);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const product = await resolveProduct(req.body);
    const price = Number(product.precio);
    const type = req.body.tipo === "membresia" ? "membresia" : "producto";
    const clientId = req.body.cliente_id || null;

    if (!product.nombre || price <= 0) {
      return res.status(400).json({ message: "Elige un producto con precio valido." });
    }

    const result = await query(
      `
        INSERT INTO ventas (cliente_id, producto, precio, tipo, fecha)
        VALUES (?, ?, ?, ?, ?)
      `,
      [clientId, product.nombre, price, type, toDateTime(req.body.fecha)]
    );

    return res.status(201).json({
      id: result.insertId,
      cliente_id: clientId,
      producto: product.nombre,
      precio: price,
      tipo: type
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const product = req.body.producto;
    const price = Number(req.body.precio);
    const type = req.body.tipo === "membresia" ? "membresia" : "producto";
    const clientId = req.body.cliente_id || null;
    const date = toDateTime(req.body.fecha);

    if (!product || price <= 0) {
      return res.status(400).json({ message: "Producto y precio son obligatorios." });
    }

    const result = await query(
      `
        UPDATE ventas
        SET cliente_id = ?, producto = ?, precio = ?, tipo = ?, fecha = ?
        WHERE id = ?
      `,
      [clientId, product, price, type, date, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Venta no encontrada." });
    }

    return res.json({
      id: Number(req.params.id),
      cliente_id: clientId,
      producto: product,
      precio: price,
      tipo: type,
      fecha: req.body.fecha
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM ventas WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Venta no encontrada." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
