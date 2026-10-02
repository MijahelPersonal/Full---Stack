# Gestión: web y escritorio

## MVP de inventario y ventas

La navegación actual es Inicio, Nueva venta, Productos, Inventario, Clientes,
Ventas y Reportes básicos. Servicios, Técnicos y Materiales permanecen en el
código anterior, fuera de la navegación. Las cuentas existentes se conservan.
ADMINISTRADOR y SUPERVISOR administran productos e inventario; VENDEDOR puede
consultar y registrar ventas y clientes. TECNICO se conserva para los módulos
antiguos y no tiene permisos comerciales. El registro de usuarios requiere
ahora un administrador autenticado y no aparece en el login.

El primer arranque del nuevo backend aplica el SQL aditivo e idempotente
`Backend/src/main/resources/db/migration/V1__comercio_mvp.sql` mediante Spring
SQL initialization. Crea cuatro tablas comerciales, amplía clientes y permite
el rol VENDEDOR. Hibernate valida el esquema; no elimina tablas antiguas.
Este MVP usa un script de esquema idempotente, no un historial Flyway.
No convierte materiales antiguos en productos ni servicios antiguos en ventas.
La base requiere el esquema anterior del proyecto.

Categoría y marca se ingresan como texto en Productos y generan los filtros
del POS. Los precios son PEN, sin cálculo separado de impuestos o descuentos.
Stock inicial, entradas, salidas y ventas crean movimientos. No hay borrado
físico de productos. Administrador puede eliminar clientes sin referencias;
los clientes con ventas o servicios se desactivan y conservan su historial. Las ventas guardan sus precios,
cliente y vendedor históricos. Los totales se calculan en Spring Boot con
BigDecimal. La transacción bloquea productos en orden estable y conserva
una clave única para reintentos. No editar tablas de stock directamente.

Las ventas son completadas; anulación, devoluciones, pagos, facturación
electrónica, múltiples almacenes y reportes avanzados están fuera del MVP.
Las consultas son listas simples para volúmenes pequeños; el MVP no incorpora
todavía paginación en servidor ni gestión independiente de categorías y marcas.

### Validación

Se creó `gestor_mvp_test` copiando únicamente el esquema anterior. Las cuentas,
productos y ventas de validación pertenecen exclusivamente a esa base.
El backend de pruebas usa 8081; la configuración normal conserva 8080.
No ejecutar las pruebas de integración contra gestor_db.

Desde Backend:

```powershell
.\mvnw.cmd -B test '-Dtest=ComercioServiceIT,ServicioServiceTest,BackendApplicationTests' '-Dspring.datasource.url=jdbc:postgresql://localhost:5432/gestor_mvp_test'
```

Desde Frontend:

```powershell
npm test -- --watch=false
npm run build
npm run build:desktop
npm run electron:dev
```

El smoke puede usar GESTION_TEST_USERNAME y GESTION_TEST_PASSWORD temporales.
GESTION_TEST_SALE=1 comprueba una venta mediante la interfaz y verifica
detalles, stock y movimientos; solo se permite con el backend de pruebas
8081 y productos VALIDACION-RTX / VALIDACION-MOUSE preparados.
GESTION_TEST_CAPTURE_DIR permite capturar la pantalla para revisión.
Cada sesión smoke tiene un perfil temporal independiente.
La compilación desktop desactiva únicamente la inserción de CSS crítico
para evitar handlers inline bloqueados por CSP; Electron mantiene su aislamiento.

Angular y Electron usan el mismo backend Spring Boot y PostgreSQL externos.
Electron no inicia ni instala Java, Spring Boot o PostgreSQL.

Desde `Frontend`, después de instalar dependencias con `npm install`:

| Comando | Resultado |
| --- | --- |
| `npm start` | Angular web en http://localhost:4200 |
| `npm run build` | Compilación web |
| `npm run electron:dev` | Inicia Angular y abre Electron; al cerrar Electron detiene Angular |
| `npm run build:desktop` | Angular optimizado en dist/desktop/browser |
| `npm run electron:start` | Abre la compilación desktop con app://gestion |
| `npm run electron:smoke:dev` | Comprueba login, preload y aislamiento en Electron desarrollo y cierra |
| `npm run electron:smoke` | Comprueba la compilación desktop y cierra |
| `npm run desktop:package` | Genera un instalador del frontend, sin backend ni base de datos |

El puerto 4200 debe estar libre para `electron:dev`. Spring Boot debe iniciarse
por separado como hasta ahora y estar disponible en http://localhost:8080.
La URL web predeterminada continúa en src/environments/environment.ts.
El build desktop utiliza environment.desktop.ts. Electron entrega su URL mediante
un IPC limitado, antes del arranque Angular. Para cambiarla en PowerShell:

```powershell
$env:GESTION_API_URL = 'http://localhost:8080/api'
npm run electron:dev
```

La URL no debe contener contraseñas. No colocar secretos PostgreSQL en Electron.
CORS mantiene http://localhost:4200 y permite app://gestion para desktop;
reiniciar el backend después del cambio de configuración de seguridad.
Las rutas Angular usan el protocolo local con fallback a index.html.
No se desactiva webSecurity ni se expone Node.js al renderer.
Las fuentes Google existentes siguen necesitando conexión a Internet.

El smoke básico no crea usuarios ni modifica datos. Los flujos SALE/MEDIA
modifican exclusivamente la base aislada y no reemplazan
una prueba de login real con un backend disponible.
Para incluir el formulario de login y una consulta autenticada al dashboard en
una comprobación smoke, proporcionar temporalmente `GESTION_TEST_USERNAME` y
`GESTION_TEST_PASSWORD` en el entorno del proceso. Se requiere una cuenta
existente con acceso al dashboard. Las credenciales y el token no se imprimen;
la sesión de prueba se elimina al finalizar. No guardar estas variables en Git.


Imágenes de productos y eliminación de clientes

Los productos admiten una imagen opcional JPG/JPEG, PNG o WEBP de hasta 2 MB.
El formulario permite vista previa, reemplazo y eliminación. Las miniaturas y
el POS muestran un placeholder cuando no hay imagen o no puede cargarse.
Spring Boot valida extensión, MIME, contenido y dimensiones (máximo 16 MP).
Los archivos usan nombres UUID, sin reutilizar el nombre aportado por el usuario.
PostgreSQL guarda únicamente imagen_url, nunca el archivo como BLOB.
La carpeta predeterminada es Backend/uploads/productos al iniciar desde Backend;
PRODUCTOS_UPLOAD_DIR permite configurar una ruta persistente controlada.
Uploads está excluido de Git. Incluir esa carpeta en las copias de seguridad.
El reemplazo elimina el archivo antiguo después del commit de la transacción;
si la transacción revierte, se elimina la imagen nueva.
GET /api/productos/imagenes/{nombre} sirve exclusivamente los archivos de imagen
validados; las cargas y cambios de productos siguen protegidos por JWT.
La imagen pública evita incluir tokens en URLs y funciona en navegador/Electron.

Productos acepta JSON como antes, y multipart con la parte producto (JSON) y
la parte opcional imagen. PUT admite eliminarImagen=true para quitarla.
Solo Administrador puede eliminar/desactivar clientes y consultar inactivos.
DELETE /api/clientes/{id} devuelve eliminado y mensaje, indicando borrado físico
o inactivación. GET /api/clientes lista activos; incluirInactivos=true está
reservado a Administrador. El POS nunca ofrece inactivos, y el backend rechaza
ventas nuevas para ellos. El bloqueo del cliente serializa venta y eliminación.

GESTION_TEST_MEDIA=1 ejecuta creación con PNG, reemplazo WEBP/JPEG, eliminación,
placeholder, POS, una venta completa, eliminación/inactivación de clientes y
comprobación de permisos. Requiere backend 8081 conectado a gestor_mvp_test,
carpeta de pruebas y credenciales temporales del entorno; no usar con gestor_db.


Inicio de sesión interno por username

POST /api/auth/login recibe username y password. El correo es contacto opcional,
no una credencial. El username se normaliza a minúsculas y tiene una restricción
UNIQUE en PostgreSQL. No hay ruta ni enlace de registro público; el endpoint
existente de creación exige JWT de Administrador.

Al iniciar Spring Boot, V2__username.sql añade el campo y asigna usernames únicos
basados en el nombre a usuarios existentes (sufijos _2, _3 en caso de coincidencia).
La migración es idempotente y conserva IDs, contraseñas, roles y demás datos.
V1 y V2 usan el separador ;; del inicializador SQL para respetar los bloques DO.
Respaldar la base antes de desplegar y reiniciar el backend con el código nuevo.
Los JWT anteriores con correo como subject dejan de ser válidos: cerrar la sesión
anterior e iniciar nuevamente con username y la misma contraseña.
En cada petición, Spring Security consulta el usuario y su rol/estado actuales;
una cuenta desactivada recibe 401 incluso con un JWT anterior aún no expirado.
