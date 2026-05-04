DROP DATABASE IF EXISTS gimnasio_admin;
CREATE DATABASE gimnasio_admin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gimnasio_admin;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(140) NOT NULL,
  telefono VARCHAR(40),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado ENUM('activo', 'vencido') NOT NULL DEFAULT 'activo',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clientes_estado (estado),
  INDEX idx_clientes_fecha_fin (fecha_fin)
);

CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  imagen_url MEDIUMTEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_productos_nombre (nombre)
);

CREATE TABLE ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NULL,
  producto VARCHAR(140) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  tipo ENUM('producto', 'membresia') NOT NULL DEFAULT 'producto',
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ON DELETE SET NULL,
  INDEX idx_ventas_fecha (fecha),
  INDEX idx_ventas_tipo (tipo)
);

INSERT INTO productos (nombre, precio, activo) VALUES
  ('Agua', 2.00, 1),
  ('Volt', 3.00, 1),
  ('Pre entreno', 3.00, 1),
  ('Pre entreno Pro', 5.00, 1),
  ('Creatina', 100.00, 1),
  ('Proteina', 120.00, 1),
  ('Sporade', 3.00, 1),
  ('Barra proteica (Chocolate)', 8.00, 1);

-- Despues de importar este backup, crear el usuario con:
-- npm run seed:admin
-- Credenciales por defecto: admin / admin123
