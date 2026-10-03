# Preparación de despliegue — STRUCH y SistemaGestion

## Arquitectura

STRUCH Astro SSR en Vercel → HTTPS → Spring Boot en Railway → PostgreSQL privado en Railway.
SistemaGestion (Angular + Electron, Windows) → el mismo API HTTPS de Railway.
Solamente Spring Boot conoce PostgreSQL y JWT_SECRET. El instalador incluye Angular, Electron y su runtime incorporado; no requiere instalar Java, PostgreSQL, Node, IntelliJ ni iniciar un backend local.

Todavía no hay URLs definitivas, despliegue real ni instalador final. No conectar públicamente la base PostgreSQL como requisito del funcionamiento diario. Las operaciones administrativas de migración pueden usar un túnel/endpoint temporal privado y las credenciales del operador.

## Railway: PostgreSQL y backend

1. Crear PostgreSQL en el proyecto Railway y conservar su volumen propio.
2. Crear un servicio del repositorio, Root Directory **/Backend**, configuración **/Backend/railway.json**, Dockerfile **Dockerfile** relativo a ese root.
3. Docker compila con Maven/Java 17 y ejecuta un JRE 17. Comando incluido: `java -jar /app/backend.jar`. Railway proporciona PORT; Spring escucha `${PORT:8080}`.
4. Activar `SPRING_PROFILES_ACTIVE=prod`. Generar el dominio público HTTPS del backend. No publicarlo como listo hasta completar las revisiones pendientes.
5. Configurar healthcheck `/api/health`, timeout 120 segundos. Consulta `SELECT 1`; devuelve solo `{"status":"UP"}` o 503 `{"status":"DOWN"}`. No devuelve información del servidor ni de la base.

Variables del servicio Backend:

| Variable | Valor/configuración |
|---|---|
| SPRING_PROFILES_ACTIVE | prod (también incluido por Docker) |
| PGHOST | referencia `${{Postgres.PGHOST}}` al host privado |
| PGPORT | `${{Postgres.PGPORT}}` |
| PGDATABASE | `${{Postgres.PGDATABASE}}` |
| PGUSER | `${{Postgres.PGUSER}}` o DB_USERNAME |
| PGPASSWORD | `${{Postgres.PGPASSWORD}}` o DB_PASSWORD |
| DATABASE_URL | alternativa JDBC: `jdbc:postgresql://HOST:PUERTO/BASE`; omitir al usar PGHOST/PGPORT/PGDATABASE |
| JWT_SECRET | secreto aleatorio nuevo de al menos 32 bytes, solo servidor |
| FRONTEND_URL | origen HTTPS definitivo de STRUCH, sin slash final ni ruta |
| UPLOAD_DIR | `/data/uploads` |
| PORT | proporcionado por Railway; no fijar localhost ni 8080 obligatorio |

Cambiar `Postgres` por el nombre real del servicio. El DATABASE_URL estándar de Railway usa `postgresql://...`: **no copiarlo directamente** a DATABASE_URL de este proyecto, que espera JDBC. Usar las cinco referencias PG* evita conversiones y credenciales en una URL. Si el proveedor exige TLS para una conexión externa, añadir las opciones JDBC requeridas; la aplicación utiliza la red privada de Railway normalmente.

Omitir las variables alternativas que no se utilicen: no definir DATABASE_URL, DB_USERNAME o DB_PASSWORD como cadenas vacías si se utilizan las referencias PG*. Una variable definida pero vacía no activa su fallback.

La configuración local sigue en `Backend/.env.properties` (ignorada por Git). Iniciar desde Backend para que Spring encuentre ese archivo. `.env.example` del Backend explica su preparación. El contenedor excluye `.env*`, target, uploads y logs mediante .dockerignore: nunca copiar secretos locales a la imagen.

## Esquema inicial y administrador

La nueva V0 crea aditivamente las siete tablas anteriores al MVP y sus restricciones cuando no existen. V1–V4 mantienen productos, stock, clientes, usuarios, catálogo y pedidos. Se conserva `ddl-auto=validate`: no generar un esquema diferente mediante Hibernate. Los scripts de inicialización son idempotentes y vuelven a ejecutarse al iniciar; no son Flyway ni un historial versionado de ejecución.

Antes de conectar datos reales, verificar el arranque contra una base vacía y respaldar cualquier destino existente. No ejecutar DROP, TRUNCATE, pg_restore --clean ni recrear la base local.

La base cloud nueva no tiene administrador y el registro interno requiere uno existente. Provisionarlo una vez con `tools/deployment/crear-admin.sql` usando un username permitido y un hash BCrypt de una **contraseña nueva y fuerte**, generado fuera del cliente con Spring BCryptPasswordEncoder o una herramienta BCrypt confiable. El script se niega a ejecutarse si ya hay usuarios. No migrar las credenciales demo débiles de la base local. El hash y la contraseña se suministran en una sesión administrativa privada, nunca en archivos versionados. Este paso queda pendiente del operador; no se ejecutó en cloud.

## Railway Volume: imágenes

Adjuntar un volumen **al servicio Backend**, mount path **/data/uploads**. Configurar `UPLOAD_DIR=/data/uploads`. Los archivos reales quedan en **/data/uploads/productos/**. El proceso debe tener permiso de escritura en ese montaje; verificarlo antes de abrir la carga de imágenes. Docker usa el usuario predeterminado de su runtime en esta primera preparación.

La referencia en PostgreSQL sigue siendo `/api/productos/imagenes/UUID.webp` (o jpg/png), independiente del sistema operativo. HTTPS lo aporta Railway. Spring valida tamaño/formato y sirve el archivo; Astro lo obtiene por el backend y sirve su proxy `/media/...`. No convertir las referencias a rutas D:\ ni servir el volumen directamente.

El volumen es independiente del backup PostgreSQL: respaldar **ambos**. No almacenar uploads en la capa efímera del contenedor. El despliegue con volumen puede tener una breve interrupción y esta primera versión usa una instancia del Backend; no habilitar réplicas con discos locales separados.

## Vercel: Astro SSR

Root Directory **/Web/frontend**. Framework **Astro**, install `npm ci`, build `npm run build`, Node **24.x**. No configurar un output estático manual: el adaptador Vercel produce `.vercel/output`.

Variables:

- `DEPLOY_TARGET=vercel` (selecciona @astrojs/vercel).
- `API_URL=https://DOMINIO_REAL_RAILWAY` **sin /api** y sin credenciales. Es variable privada del servidor, nunca PUBLIC_API_URL.

El modo sigue siendo `output: server`. Desarrollo y ejecución Node local usan @astrojs/node; no hay conversión a sitio estático, ISR ni caché de catálogo. Cuenta, login, pedidos, checkout y carrito siguen pasando por las rutas SSR/API existentes. Cookies de sesión HttpOnly/SameSite=lax y Secure en HTTPS. PostgreSQL y JWT_SECRET no se configuran en Vercel.

Configurar API_URL y DEPLOY_TARGET en los entornos de Vercel que se utilicen (Production/Preview), y volver a construir tras cambios. Las cuentas/pedidos no deben compartirse mediante caches de CDN. Las imágenes UUID sí se cachean como recursos inmutables.

CORS acepta orígenes exactos. Desarrollo: localhost:4200, localhost:4321 y app://gestion; catálogo público también permite 127.0.0.1:4321. Producción: FRONTEND_URL y app://gestion. No se usa Access-Control-Allow-Origin:*. Las llamadas servidor-servidor desde Astro no dependen de CORS; los formularios Astro conservan su comprobación de Origin.

## Angular y Electron

Web Angular local: `npm start` desde Frontend → localhost:4200 → config.json local → localhost:8080/api. Para alojar Angular web con HTTPS, cambiar **el config.json del artefacto web** por la URL HTTPS definitiva terminada en /api antes de publicarlo. Este archivo no contiene secretos.

Electron desarrollo: `npm run electron:dev` desde Frontend. Conserva localhost:8080/api; GESTION_API_URL opcional permite pruebas contra otro backend. Mantiene nodeIntegration=false, contextIsolation=true y sandbox=true.

El build desktop excluye config.json web y no tiene un fallback de API local en su environment. El proceso principal entrega la URL por el preload existente. Al estar empaquetado, solamente lee `electron/config.production.json` incorporado: **no acepta un override por variable de entorno del usuario final**. El CSP autoriza únicamente el origen elegido para API e imágenes; no añade localhost en producción.

Cuando exista la URL definitiva, desde Frontend en PowerShell:

```powershell
$env:GESTION_API_URL='https://DOMINIO_REAL_RAILWAY/api'
npm run desktop:package
Remove-Item Env:GESTION_API_URL
```

El script prepara configuración pública, compila Angular y ejecuta electron-builder/NSIS. Salida: **Frontend/release/SistemaGestion-Setup.exe**. El programa es SistemaGestion.exe. No se incluye Spring Boot, JDK, PostgreSQL ni una base de datos. Node está incorporado como parte del runtime de Electron, sin requerir una instalación externa.

`beforePack` rechaza configuración ausente, HTTP, localhost, credenciales y URL distinta de la preparada. No generar el instalador hasta conocer la URL real. Para verificar solo el empaquetador se permite `npm run desktop:verify` con configuración preparada y URL real; produce un directorio sin instalador. Una verificación con dominio .invalid es exclusivamente QA y su artefacto no se publica. Firma de código Windows y certificado quedan pendientes si se desea evitar advertencias de SmartScreen; no hay release publicada.

## Trasladar catálogo e imágenes sin importar toda la base

Se conserva el seeder DEMO original de Web/tools/demo. El traslado de los **58 productos actuales**, incluyendo los manuales, usa `tools/deployment/catalogo.py` y la API autenticada:

1. Hacer backup custom con pg_dump de la base local, y copiar uploads. Exportar en una ventana sin ventas/ediciones concurrentes.
2. Configurar TRANSFER_USERNAME y TRANSFER_PASSWORD del administrador **local** en el entorno del proceso. No guardar en scripts ni historial compartido.
3. Exportar a una carpeta nueva bajo backups (ignorada):

```powershell
python tools/deployment/catalogo.py exportar --api http://localhost:8080/api --bundle backups/catalogo-para-cloud
```

4. El bundle contiene solo productos/precios/stock/contenido web y copias de imágenes con SHA256. No contiene usuarios, passwords, JWT, clientes, ventas ni pedidos. Es privado porque contiene precios de compra. No lo subir a Vercel ni Git.
5. Arrancar Railway con esquema nuevo y provisionar su administrador. Hacer backup custom **del destino cloud** y conservarlo localmente. Cambiar las variables TRANSFER_* por las credenciales cloud.
6. Primero simular y revisar los SKU existentes:

```powershell
python tools/deployment/catalogo.py importar --api https://DOMINIO_REAL_RAILWAY/api --bundle backups/catalogo-para-cloud
```

7. Solo cuando se apruebe el destino real:

```powershell
python tools/deployment/catalogo.py importar --api https://DOMINIO_REAL_RAILWAY/api --bundle backups/catalogo-para-cloud --apply --backup backups/DESTINO-cloud.dump
```

La herramienta crea cada producto por el endpoint existente con stock cero, carga su imagen por multipart al Volume y registra ENTRADA con motivo de migración. No cambia SKU existentes, no repone stock en otra ejecución y conserva un diario privado para reanudar. Las imágenes pasan por las validaciones del backend; los UUID y slugs se regeneran, por lo que las URLs locales no se conservan como enlaces públicos.

El traslado establece un **saldo inicial cloud** igual al stock actual local: no importa el historial anterior de ventas/movimientos ni clientes/pedidos privados. Si se necesita migrarlos después, preparar una restauración completa separada con revisión de privacidad y credenciales. No ejecutar un dump completo local sobre una base cloud que ya contiene datos. El script no verifica automáticamente que el backup suministrado corresponda al destino: el operador debe comprobarlo.

Conservar el bundle/diario hasta terminar. No ejecutar dos importaciones concurrentes y no editar el manifiesto durante la importación. Si hay un error, no borrar ni compensar automáticamente productos: revisar el diario, stock y movimientos antes de reanudar.

## Comprobaciones y pendientes

```powershell
# Backend, desde Backend: base de pruebas aislada, nunca gestor_db para tests.
./mvnw.cmd '-Dspring.datasource.url=jdbc:postgresql://localhost:5432/gestor_mvp_test' '-Dtest=*,*IT' package
# Esquema desde cero: crear gestor_deploy_test vacía y ejecutar solo pruebas de arranque/health.
./mvnw.cmd '-Dspring.datasource.url=jdbc:postgresql://localhost:5432/gestor_deploy_test' '-Dtest=BackendApplicationTests,HealthDeploymentIT' test
# Frontend
npm test -- --watch=false
npm run build
npm run build:desktop
node --test electron/config.test.cjs
# Web/frontend
npm test
npm run build
# Build Vercel; sin deploy ni llamadas al dominio de comprobación.
$env:DEPLOY_TARGET='vercel'
$env:API_URL='https://deployment-check.invalid'
npm run build
Remove-Item Env:DEPLOY_TARGET,Env:API_URL
```

Después del despliegue real: GET `https://DOMINIO_REAL_RAILWAY/api/health` → 200 UP; catálogo y una imagen pública; login interno y roles; cuenta cliente y pedido; reservas, entrega y venta; rechazar origen no autorizado y JWT de usuario desactivado; reiniciar/redeploy y verificar que el Volume conserva imágenes; instalar Setup en una PC sin herramientas de desarrollo.

Bloqueos: faltan dominios Railway/Vercel, secretos nuevos y administrador cloud, Volume definitivo y comprobación de persistencia real. Docker y empaquetado deben validarse con las herramientas disponibles; no confundir un build local con un despliegue real.

La auditoría detectó path-to-regexp vulnerable del adaptador Vercel y se fijó 6.3.0 compatible. Sigue pendiente la alerta de **http-cache-semantics 4.2.0** (GHSA-ch52-4w7c-c8xp): el registro consultado no ofrece una versión superior corregida. No se aplicó npm audit fix --force que proponía versiones antiguas incompatibles. Revisar resolución oficial o mitigación antes de publicar; los flujos de cuenta/catálogo ya usan no-store, pero eso no sustituye resolver una dependencia reportada.

Referencias oficiales: [Astro en Vercel](https://docs.astro.build/en/guides/deploy/vercel/), [Railway variables](https://docs.railway.com/variables), [Railway volumes](https://docs.railway.com/volumes/reference), [Railway healthchecks](https://docs.railway.com/deployments/healthchecks).
