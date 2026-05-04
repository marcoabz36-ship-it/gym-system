const bcrypt = require("bcryptjs");
const { pool, query } = require("../src/db");

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(password, 10);

  await query(
    `
      INSERT INTO usuarios (username, password)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `,
    [username, hash]
  );

  console.log(`Usuario listo: ${username}`);
  console.log("Guarda la contrasena en un lugar seguro.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
