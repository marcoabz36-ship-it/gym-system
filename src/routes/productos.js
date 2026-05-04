const router = require("express").Router();
const { query } = require("../db");

function normalizeImage(value) {
  if (!value) return null;
  const image = String(value);

  if (!image.startsWith("data:image/")) {
    const error = new Error("La imagen debe ser un archivo de imagen valido.");
    error.status = 400;
    throw error;
  }

  if (image.length > 1_500_000) {
    const error = new Error("La imagen es demasiado grande. Usa una imagen mas pequena.");
    error.status = 400;
    throw error;
  }

  return image;
}

router.get("/", async (req, res, next) => {
  try {
    const products = await query(
      `
        SELECT id, nombre, precio, imagen_url, activo
        FROM productos
        WHERE activo = 1
        ORDER BY FIELD(
          nombre,
          'Agua',
          'Volt',
          'Sporade',
          'Pre entreno',
          'Pre entreno Pro',
          'Barra proteica (Chocolate)',
          'Creatina',
          'Proteina'
        ), nombre ASC
      `
    );

    return res.json(products);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { nombre, precio } = req.body;
    const image = normalizeImage(req.body.imagen_url);

    if (!nombre || Number(precio) <= 0) {
      return res.status(400).json({ message: "Nombre y precio son obligatorios." });
    }

    const result = await query(
      "INSERT INTO productos (nombre, precio, imagen_url, activo) VALUES (?, ?, ?, 1)",
      [nombre, Number(precio), image]
    );

    return res.status(201).json({
      id: result.insertId,
      nombre,
      precio: Number(precio),
      imagen_url: image,
      activo: 1
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { nombre, precio, activo = 1 } = req.body;
    const isActive = activo === false || activo === 0 || activo === "0" ? 0 : 1;
    const image = normalizeImage(req.body.imagen_url);

    if (!nombre || Number(precio) <= 0) {
      return res.status(400).json({ message: "Nombre y precio son obligatorios." });
    }

    const result = await query(
      "UPDATE productos SET nombre = ?, precio = ?, imagen_url = ?, activo = ? WHERE id = ?",
      [nombre, Number(precio), image, isActive, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    return res.json({
      id: Number(req.params.id),
      nombre,
      precio: Number(precio),
      imagen_url: image,
      activo: isActive
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query("UPDATE productos SET activo = 0 WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
