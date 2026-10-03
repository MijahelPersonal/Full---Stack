# Despliegue real — 03/10/2026

## Servicios

- WEB: **https://struch.vercel.app**. Vercel proyecto `struch`, raíz `Web/frontend`, Node 24, production READY; deployment `dpl_2MHUEXxbRRbvyYF4CS4JX1Rbe7Bv`.
- API: **https://backend-production-cd4a.up.railway.app/api**.
- Health: https://backend-production-cd4a.up.railway.app/api/health devuelve `{"status":"UP"}`.
- [Railway STRUCH](https://railway.com/project/f780c788-848f-44b2-8480-e8872a31f754), entorno production; Backend Dockerfile raíz `/Backend`, perfil prod, healthcheck `/api/health`. Deployment final `a2ae3ce8-c736-4400-ae96-13e456b1cf7a`: SUCCESS.
- PostgreSQL 18 privado con volumen propio. Backend utiliza referencias Railway a PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD, sin secretos en Git. JWT_SECRET aleatorio generado directamente en Railway.
- Volume Backend `e1d11e15-22ee-460e-a6ca-d3f45cb8cf92`: `/data/uploads`, imágenes en `/data/uploads/productos`.
- Vercel: DEPLOY_TARGET=vercel; API_URL=https://backend-production-cd4a.up.railway.app.
- CORS final: https://struch.vercel.app y app://gestion; sin wildcard autenticado ni orígenes locales en producción.
- Publicación por CLI; no se configuró autodeploy GitHub. Un push posterior no publica automáticamente.

## Migración y persistencia

- 58 productos/SKU únicos, 15 categorías y 58 imágenes importados por API desde `backups/catalogo-para-cloud`.
- Nombres, categorías, marcas, precios compra/venta, stock, mínimo, estado, descripción, especificaciones, destacados y precio anterior coinciden con el bundle.
- 56 entradas iniciales para productos con stock positivo; dos agotados conservan stock cero.
- Segunda importación: cero productos nuevos y cero entradas iniciales duplicadas.
- SHA256 de las 58 imágenes Railway igual a los originales; las 58 también accesibles como imágenes optimizadas en Vercel.
- Tras otro redeploy: mismo catálogo, precios y stock; 58 imágenes siguen disponibles en Backend y Vercel.
- Backup custom cloud antes de importar/provisionar: `backups/cloud-deployment/struch-before-import.dump`, 37 129 bytes. DB local y backups anteriores conservados.
- El proxy TCP temporal usado para backup/provisión por TLS fue retirado. La comprobación final devuelve `tcpProxies: []`.

## Administrador

Usuario cloud **mijahel**, contraseña **nueva aleatoria fuerte**, BCrypt coste 12. No se reutilizó la contraseña local ni se migraron contraseñas en texto plano.

Contraseña protegida por Windows DPAPI en `backups/cloud-deployment/admin-mijahel.dpapi`, ignorado por Git. Requiere el mismo usuario Windows. Para copiarla al portapapeles, ejecutar manualmente desde el repositorio:

```powershell
& ./tools/deployment/copiar-clave-admin-cloud.ps1
```

Pegar en Gestión y limpiar después con `Set-Clipboard -Value ''`. No enviar contraseña/archivo por chat. Conservar ese archivo privado.

## Pruebas

- Spring Boot: 38 pruebas, cero fallos/errores, DB `gestor_mvp_test`.
- Angular: 24 pruebas; configuración Electron: 2 pruebas.
- Astro: 22 pruebas aprobadas contra Vercel; tres escenarios aislados omitidos (base vacía, API caída y fixture checkout local). Checkout cloud validado por separado.
- Build Vercel: Astro check 49 archivos, cero errores/avisos, SSR publicado.
- Navegador real: catálogo con 58 productos e imágenes visibles; sin errores/avisos capturados en consola.
- API pública sin precio compra/stock mínimo/datos internos. APIs autenticadas de Inicio, Productos, Inventario, Pedidos, Ventas, Reportes y Clientes verificadas.
- Cliente web: registro, login, cookie HttpOnly/Secure/SameSite=Lax, Mi cuenta no-store, creación/consulta de pedido y reintento idempotente.

### Pedido QA conservado

**STR-20261003-JRL5ARNM6S**, pedido `ade6490c-7279-43c7-b9bd-0de0b7f4981c`, SKU `STR-DEMO-ACC-USB-001`, una unidad, **S/35.00**.

PENDIENTE → CONFIRMADO (reserva stock -1) → LISTO_PARA_RECOGER → ENTREGADO → venta WEB `4f06873e-c1cc-4fdc-a184-4eaba5aaa1b8`, visible en reportes. La entrega no descuenta otra vez.

Se restituyó la unidad mediante movimiento `Restitución de unidad QA despliegue cloud: STR-20261003-JRL5ARNM6S`. Stock final igual al original. Cliente QA inactivo; login posterior rechazado. Venta/pedido conservados para trazabilidad: los reportes incluyen esta venta QA de S/35.

`tools/deployment/verificar-cloud.py` solo lee por defecto; `--pedido-qa` autoriza el escenario con restitución y rechaza repetirlo si el reporte ya contiene un pedido. Credenciales únicamente por entorno. Evidencias ignoradas: `Backend/target/cloud-verification.json`, `cloud-persistence.json`, `cloud-electron-smoke.log`, `struch-cloud.png` y `cloud-electron/mvp-desktop.png`.

## Electron

- `Frontend/release/SistemaGestion-Setup.exe`, Windows x64, **115 090 327 bytes (~110 MiB)**.
- SHA256 `768D2F58455EF5D83DE78FFA5E5FEEB2880A3AD162DF2E71D0BC75D004E5A45E`.
- API incorporada https://backend-production-cd4a.up.railway.app/api. Configuración generada ignorada.
- app.asar no incluye Java/backend/JAR, archivos .env, config.json local del renderer ni los secretos reales JWT/DB/administrador. No requiere Java, PostgreSQL ni Node externos.
- Se ejecutó **win-unpacked**: login, dashboard, Productos, Inventario, Pedidos web, Ventas y Reportes renderizados; APIs HTTP 200; smoke salida 0. nodeIntegration=false, contextIsolation=true, sandbox=true.
- No se instaló NSIS en otra PC. La prueba corresponde al ejecutable empaquetado generado junto al Setup en este equipo.

### Instalación Windows real — cierre de etapa

Se ejecutó el Setup normalmente y se instaló en `C:\Users\USER\AppData\Local\Programs\frontend\SistemaGestion.exe`. Se abrió el ejecutable de esa instalación, no Electron development ni win-unpacked. No se desinstaló al finalizar.

Login cloud, dashboard, Productos, Inventario, Pedidos web, Ventas y Reportes pasaron con APIs HTTP 200; Venta en tienda renderizó productos e imágenes Railway y cliente Público general. La comprobación fue de lectura y no creó ventas.

Se detuvo temporalmente el proceso Spring Boot habitual, se comprobó que no existía listener en el puerto 8080 y se repitió el smoke de la instalación: salida 0, API exclusivamente `https://backend-production-cd4a.up.railway.app/api`. Después se restauró Spring Boot local. PostgreSQL local no se detuvo ni alteró.

La primera detención por Stop-Process falló y dejó el backend activo; se descartó esa comprobación como prueba de independencia local. La repetición verificó la terminación del proceso antes del smoke. Evidencias privadas: `Backend/target/installed-no-localhost.log` y `installed-no-localhost/mvp-desktop.png`.

El código de esta versión no había eliminado explícitamente el menú nativo predeterminado de Electron; no se declara su eliminación en esta etapa de documentación/distribución. No se saltaron protecciones de Windows.

Distribución pública: [STRUCH v0.1.0 Demo](https://github.com/MijahelPersonal/Full---Stack/releases/tag/v0.1.0-demo), prerelease creada desde `292e8ee7cf524df1df897f5cfde99f5dfe8c10de` de feature/tienda-web. [Asset directo SistemaGestion-Setup.exe](https://github.com/MijahelPersonal/Full---Stack/releases/download/v0.1.0-demo/SistemaGestion-Setup.exe): 115 090 327 bytes, SHA256 igual al instalador local. El ejecutable no se incluye en el historial Git. README y capturas se actualizan en la rama feature/tienda-web; main permanece sin merge.

## Incidencias y límites

- Railway CLI: alta inicial de Volume falló internamente; completada con IDs. SSH requirió registrar clave en .ssh y el túnel no abrió; se usó proxy TLS temporal, ya retirado.
- GraphQL Railway rechaza Builder=DOCKERFILE y railwayConfigFile por deprecación. Raíz/Dockerfile/healthcheck configurados directamente; el build real del upload sí reconoció railway.json y utilizó el Dockerfile preparado.
- Primer Vercel build falló (`astro: command not found`): exclusión Frontend/ omitía también Web/frontend. `.vercelignore` ahora ancla a la raíz; segundo build correcto.
- Pruebas públicas recibieron 503 durante redeploy CORS; repetidas con Backend SUCCESS, pasaron.
- CSS login Angular: 5.52 kB frente a aviso 4 kB; build correcto.
- Setup **NotSigned**, icono predeterminado; no se dispone de certificado Authenticode. No se afirma confianza SmartScreen ni prueba en otra PC.
- npm audit conserva cuatro entradas altas transitivas por http-cache-semantics 4.2.0; [advisory oficial](https://github.com/advisories/GHSA-ch52-4w7c-c8xp) sin versión corregida al 03/10/2026. El uso encontrado en Astro está en assets/build/remote.js; no se llama satisfiesWithoutRevalidation en Astro/adaptador ni se cachean respuestas de cuentas en nuestra app. Cuenta usa no-store; proxy de imágenes no transmite cookies de cuenta. Este análisis **no elimina el advisory**; revisar/actualizar cuando exista corrección.

## Git

Preparación: `dacb0fe54a6cecd1d4870c5ad7f7d942e916bc76`, 36 archivos, push a origin/feature/tienda-web. Ajustes de upload, comprobaciones cloud/Electron y este informe se guardan en commit adicional. Sin merge ni cambio de rama. Secretos, backups, logs y artefactos no se incluyen en Git.
