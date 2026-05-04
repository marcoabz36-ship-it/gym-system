# Sistema web para gimnasio

Aplicacion simple para una administradora de gimnasio: clientes, membresias, ventas rapidas, dashboard e historial.

## Tecnologias

- Frontend: HTML, CSS y JavaScript vanilla
- Backend: Node.js con Express
- Base de datos: MySQL
- Seguridad: login con JWT y contrasenas encriptadas con bcrypt

## Instalacion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear la base de datos en MySQL:

```bash
mysql -u root -p < database/schema.sql
```

3. Copiar variables de entorno:

```bash
cp .env.example .env
```

4. Crear usuario administrador:

```bash
npm run seed:admin
```

Credenciales por defecto para desarrollo:

- Usuario: `admin`
- Contrasena: `admin123`

5. Iniciar la aplicacion:

```bash
npm run dev
```

Luego abrir `http://localhost:3000`.

## Endpoints principales

- `POST /login`
- `GET /clientes`
- `POST /clientes`
- `PUT /clientes/:id`
- `DELETE /clientes/:id`
- `POST /clientes/:id/renovar`
- `POST /ventas`
- `GET /ventas`
- `PUT /ventas/:id`
- `DELETE /ventas/:id`
- `GET /dashboard`

Tambien existen versiones con prefijo `/api`, utiles si el frontend se despliega separado.

## Despliegue sugerido

Backend y MySQL en Railway:

- Crear servicio MySQL.
- Importar `database/schema.sql` o `database/backup.sql`.
- Crear servicio Node.js apuntando a este repositorio.
- Configurar las variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `DB_SSL=true`.
- Ejecutar `npm run seed:admin` una vez para crear el usuario.

Frontend en Vercel:

- Publicar la carpeta `public`.
- Editar `public/config.js` con la URL del backend:

```js
window.GYM_API_URL = "https://tu-backend.railway.app";
```

Si se sirve desde Express, no hace falta cambiar `public/config.js`.

## Backup SQL

El archivo `database/backup.sql` recrea la base y carga productos iniciales. Despues de importarlo, ejecutar `npm run seed:admin` para crear el usuario con bcrypt.

## Uso de ventas

En `Ventas rapidas` hay tres zonas:

- `Productos rapidos`: productos de venta frecuente como agua, Volt, Sporade, pre entreno y barra proteica.
- `Ventas grandes`: productos de mayor monto como creatina y proteina.
- `Ultimas ventas`: permite editar o eliminar ventas de producto registradas por error.

Para agregar un producto nuevo:

1. Entrar a `Ventas rapidas`.
2. Presionar `Agregar producto`.
3. Escribir nombre y precio.
4. Opcionalmente presionar `Subir imagen`.
5. Presionar `Guardar producto`.

Si el producto cuesta S/ 50 o mas, o su nombre incluye proteina/creatina, aparecera en `Ventas grandes`.
