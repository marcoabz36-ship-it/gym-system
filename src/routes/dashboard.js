const router = require("express").Router();
const { query, refreshClientStatuses } = require("../db");

router.get("/", async (req, res, next) => {
  try {
    await refreshClientStatuses();

    const days = Math.max(1, Number(req.query.dias_vencimiento || 5));
    const [incomeDay] = await query(
      "SELECT COALESCE(SUM(precio), 0) AS total FROM ventas WHERE DATE(fecha) = CURDATE()"
    );
    const [incomeMonth] = await query(
      `
        SELECT COALESCE(SUM(precio), 0) AS total
        FROM ventas
        WHERE YEAR(fecha) = YEAR(CURDATE())
          AND MONTH(fecha) = MONTH(CURDATE())
      `
    );
    const [activeClients] = await query(
      "SELECT COUNT(*) AS total FROM clientes WHERE estado = 'activo'"
    );
    const expiring = await query(
      `
        SELECT
          id,
          nombre,
          telefono,
          DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin
        FROM clientes
        WHERE fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY fecha_fin ASC, nombre ASC
      `,
      [days]
    );
    const chart = await query(
      `
        SELECT
          DATE_FORMAT(fecha, '%Y-%m-%d') AS dia,
          COALESCE(SUM(precio), 0) AS total
        FROM ventas
        WHERE DATE(fecha) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(fecha)
        ORDER BY dia ASC
      `
    );
    const recentSales = await query(
      `
        SELECT
          v.id,
          v.producto,
          v.precio,
          v.tipo,
          c.nombre AS cliente,
          DATE_FORMAT(v.fecha, '%Y-%m-%d %H:%i') AS fecha
        FROM ventas v
        LEFT JOIN clientes c ON c.id = v.cliente_id
        ORDER BY v.fecha DESC, v.id DESC
        LIMIT 8
      `
    );

    return res.json({
      ingresos_dia: Number(incomeDay.total || 0),
      ingresos_mes: Number(incomeMonth.total || 0),
      clientes_activos: Number(activeClients.total || 0),
      membresias_por_vencer: expiring,
      grafico_ingresos: chart.map((item) => ({
        dia: item.dia,
        total: Number(item.total || 0)
      })),
      ventas_recientes: recentSales
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
