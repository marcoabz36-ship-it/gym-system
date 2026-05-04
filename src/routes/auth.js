const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../db");

const router = require("express").Router();

router.post("/", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Escribe usuario y contrasena." });
    }

    const users = await query(
      "SELECT id, username, password FROM usuarios WHERE username = ? LIMIT 1",
      [username]
    );

    const user = users[0];
    const isValid = user ? await bcrypt.compare(password, user.password) : false;

    if (!isValid) {
      return res.status(401).json({ message: "Usuario o contrasena incorrectos." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
