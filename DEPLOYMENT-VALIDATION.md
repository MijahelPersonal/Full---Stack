# Validación de preparación para despliegue — 03/10/2026

Rama `feature/tienda-web`, basada en el commit aprobado `47973ee0dcbf648909a3b4e5ae2b03ed7896a3e3`. Esta preparación no hizo commit, push, merge, despliegue real, publicación de release ni generación de Setup.exe.

## Resultado de pruebas y builds

| Comprobación | Resultado |
|---|---|
| Spring Boot | 38 pruebas, 0 fallos y 0 errores en gestor_mvp_test |
| Esquema vacío | V0–V4 crean y validan las tablas en gestor_deploy_test; health y CORS verificados |
| Build backend | JAR de producción generado con Maven; bytecode objetivo Java 17 |
| Perfil prod | JAR final iniciado en 8082 contra base aislada; configuración obligatoria, secreto temporal aleatorio y directorio absoluto; GET /api/health=200 UP |
| Angular | 24 pruebas aprobadas, 13 archivos |
| Angular web y desktop | Ambos builds aprobados |
| Configuración Electron | 2 pruebas aprobadas; rechaza HTTP, localhost, credenciales y URL inválida |
| Electron desarrollo y Angular compilado local | Login autorizado, dashboard y API protegida HTTP 200; sandbox=true, contextIsolation=true, nodeIntegration=false |
| electron-builder | Build Windows x64 --dir aprobado; SistemaGestion.exe QA ejecutado, salida 0, login renderizado, sin acceso a Node en renderer |
| Astro | 22 pruebas aprobadas; 3 omitidas que requieren escenarios aislados de base vacía, API caída y checkout |
| Astro Node | SSR build aprobado, 0 errores/advertencias de Astro check |
| Astro Vercel | SSR build aprobado y .vercel/output generado; no se desplegó |
| Traslado de catálogo | Exportación privada de los 58 productos y 58 imágenes reales; importación por API únicamente en gestor_deploy_test |
| Integridad de traslado | 58 SKU distintos, 15 categorías, 2 agotados, 56 entradas iniciales; precios, stock y contenido iguales al origen; 58 SHA256 de imágenes coincidentes |
| Idempotencia | Reejecuciones sobre destino aislado crean 0 productos y 0 movimientos adicionales |
| Local habitual | Backend 8080 devuelve UP; STRUCH 4321 devuelve 200 y API pública conserva 58 productos |

La suite original protege gestor_db exigiendo explícitamente gestor_mvp_test. El primer intento de ejecutar toda la suite contra la base nueva fue rechazado por esas comprobaciones; se conservaron intactas y se repitió en la base prevista. El arranque/schema/health sí se verificó en la base nueva. Un empaquetado intermedio encontró el JAR abierto por el proceso QA Windows: se cerró ese proceso y el empaquetado final pasó.

La verificación del ejecutable empaquetado usó `https://deployment-check.invalid/api` exclusivamente para comprobar la configuración HTTPS y la carga de Angular sin backend real. El resultado `backend.reachable=false` es esperado en esa prueba y **no acredita conexión a Railway**. Se retiraron el ejecutable QA y config.production.json con ese dominio. No quedó un instalador apuntando a una URL ficticia. Falta probar la conexión cloud y la instalación en otra PC cuando existan las URLs definitivas.

La base habitual no recibió nuevos productos, cambios de stock, usuarios ni ventas durante esta preparación. La migración de prueba y el administrador de prueba se crearon solamente en gestor_deploy_test. Los bundles/backups están bajo backups/, ignorados por Git. No se exportaron datos de clientes, usuarios o ventas al bundle de catálogo. El destino de prueba recibe un saldo inicial, no el historial local anterior.

## Pendientes

- Dominios definitivos Railway/Vercel, variables reales y administrador cloud con contraseña nueva fuerte.
- Railway Volume: mount /data/uploads, archivos en /data/uploads/productos; comprobar escritura y persistencia tras redeploy real.
- Docker no está instalado/disponible en este entorno: se preparó Dockerfile y se verificó el JAR con Java, pero no se construyó ni ejecutó la imagen Docker aquí.
- npm audit: se corrigió path-to-regexp a 6.3.0 mediante override compatible. Quedan 4 entradas altas relacionadas con http-cache-semantics 4.2.0 (incluyen los paquetes ascendientes Astro/adaptadores), no cuatro fallos distintos del negocio. El registro consultado no ofrece una versión posterior corregida. Resolver/revisar antes de publicar; no se aplicó un downgrade incompatible.
- Advertencia CSS anterior del login Angular: 5.52 kB frente al presupuesto de aviso de 4 kB. Ambos builds completan correctamente; no se modificó el diseño.
- electron-builder informa icono predeterminado y metadatos author/description ausentes. No impiden el build; firma/certificado y personalización final del instalador quedan pendientes.

Configuración, comandos de Railway/Vercel, primer administrador y traslado: [DEPLOYMENT.md](DEPLOYMENT.md).

## Archivos de esta preparación y git status final

La salida siguiente enumera archivos nuevos y modificados; caches, logs, JAR, builds, backups, bundle privado y configuración Electron generada están excluidos.

```text
 M .gitignore
 M Backend/src/main/java/com/mijahel/backend/security/SecurityConfig.java
 M Backend/src/main/resources/application.properties
 M Frontend/angular.json
 M Frontend/electron-builder.yml
 M Frontend/electron/main.cjs
 M Frontend/electron/protocol.cjs
 M Frontend/package.json
 M Frontend/src/app/core/services/runtime-config.service.ts
 M Frontend/src/environments/environment.desktop.ts
 M Web/frontend/.env.example
 M Web/frontend/astro.config.mjs
 M Web/frontend/package-lock.json
 M Web/frontend/package.json
 M Web/frontend/src/lib/catalogo.ts
?? .env.example
?? Backend/.dockerignore
?? Backend/Dockerfile
?? Backend/railway.json
?? Backend/src/main/java/com/mijahel/backend/controller/HealthController.java
?? Backend/src/main/java/com/mijahel/backend/security/ProductionConfig.java
?? Backend/src/main/resources/application-prod.properties
?? Backend/src/main/resources/db/migration/V0__base_legacy.sql
?? Backend/src/test/java/com/mijahel/backend/service/HealthDeploymentIT.java
?? DEPLOYMENT-VALIDATION.md
?? DEPLOYMENT.md
?? Frontend/.env.example
?? Frontend/electron/before-pack.cjs
?? Frontend/electron/config.cjs
?? Frontend/electron/config.test.cjs
?? Frontend/electron/prepare-production.cjs
?? Frontend/public/config.json
?? Frontend/src/app/core/services/runtime-config.service.spec.ts
?? Web/frontend/tests/deployment.test.mjs
?? tools/deployment/catalogo.py
?? tools/deployment/crear-admin.sql
```
