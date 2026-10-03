# Validación del catálogo DEMO — 03/10/2026

La carga se ejecutó explícitamente contra `gestor_db` mediante Spring Boot en localhost:8080. No se cambiaron Astro, Angular, Electron ni la lógica de categorías para mostrar productos. El catálogo completo está en [CATALOGO-DEMO.md](CATALOGO-DEMO.md); la herramienta de importación está en [tools/demo/README.md](tools/demo/README.md).

## Resultado real

| Comprobación | Resultado |
|---|---:|
| Productos creados | 56 |
| Productos manuales conservados íntegramente | 2 |
| Total actual | 58 |
| Categorías utilizadas | 15 |
| SKU nuevos / SKU nuevos distintos | 56 / 56 |
| Nuevos activos | 56 |
| Stock normal (> mínimo) | 45 |
| Stock bajo (positivo ≤ mínimo) | 9 |
| Sin stock | 2 |
| Entradas iniciales reales | 54 |
| Imágenes cargadas y verificadas | 56 |
| Ilustraciones útiles descartadas por error | 0 |
| Productos destacados nuevos | 8 |
| Productos nuevos en oferta | 9 |

Precio de venta DEMO: S/35–S/6499. Precio de compra: 74% del precio de venta, con dos decimales. Stock mínimo: 2–5. Marca genérica Struch. Los dos productos sin stock no generan movimientos de cantidad cero.

Se reutilizó `Memoria Ram`, el nombre existente. El HDD de la carpeta accesorios corresponde a Almacenamiento. CONTACT-SHEET.webp es un índice visual y se excluyó intencionalmente. No fue necesario utilizar el respaldo `demo-product-images`.

## Preservación y repetición

Antes de escribir se creó `backups/2026-10-03-catalogo-demo/gestor_db.dump` con pg_dump custom y se verificó su lectura con pg_restore --list (88 entradas). Se conservaron también las imágenes preexistentes en `backups/2026-10-03-catalogo-demo/productos/`.

SHA256 del dump: `EB5C3D22034B591AB4515AE85D9AC80CF66D74B15B58D249D017A0D6A52EAD12`.

Primera ejecución: 56 productos, 56 imágenes y 54 entradas. Segunda ejecución: 0 productos creados, 56 omitidos por SKU y 0 entradas adicionales. Las imágenes originales permanecieron intactas y las imágenes servidas por Spring Boot coincidieron por SHA256 con su biblioteca. Se verificaron exactamente los productos y movimientos preexistentes; usuarios, clientes, ventas y pedidos conservaron sus datos.

El diario de importación, backups, target, uploads y logs están ignorados por Git. Se retiraron los scripts temporales de implementación anteriores identificados y el script temporal de comprobación Electron; se conservó el seeder separado, sin ejecución automática al arrancar el backend.

## Pruebas

- Spring Boot: 35 pruebas aprobadas, 0 fallos, 0 errores; base aislada `gestor_mvp_test`.
- Angular: 21 pruebas aprobadas en 12 archivos.
- Astro: 21 pruebas aprobadas, 0 fallos; 3 omitidas que requieren escenarios aislados de base vacía, API apagada y checkout. La prueba de rutas se ejecutó contra STRUCH habitual en localhost:4321.
- PostgreSQL habitual: consulta de solo lectura confirmó 56 SKU distintos, 56 activos, 45 normales, 9 bajos, 2 agotados, 56 imágenes y 54 movimientos iniciales.
- API pública: verificación de cada una de las 56 fichas; imagen, precio y stock reales, sin precio de compra expuesto.
- STRUCH: catálogo muestra 58 productos, 15 categorías y marca Struch; imágenes cargadas, ficha individual con precio y stock; filtro Sin stock devuelve los dos agotados. Sin errores de consola observados.
- Electron compilado y desarrollo: login autorizado, dashboard y API protegida HTTP 200; nodeIntegration=false, contextIsolation=true, sandbox=true.
- Angular dentro de Electron: Productos=58, Inventario=58, POS=58; 56 imágenes del nuevo catálogo cargadas; historial muestra la entrada inicial; 2 botones Agregar deshabilitados por stock cero. Selección y retirada de un producto del resumen correctas, sin finalizar ni registrar una venta.

Spring Boot en localhost:8080 y STRUCH en localhost:4321 quedaron funcionando. No se hizo commit, push ni merge. Rama: `feature/tienda-web`.

## Git status final

El estado incluye trabajo de etapas anteriores todavía sin commit; esta tarea agregó únicamente herramientas/documentación de catálogo y reglas de exclusión. A continuación se conserva la salida final.

```text
 M .gitignore
 M Backend/src/main/java/com/mijahel/backend/controller/ClienteController.java
 M Backend/src/main/java/com/mijahel/backend/dto/ComercioDTO.java
 M Backend/src/main/java/com/mijahel/backend/entity/Cliente.java
 M Backend/src/main/java/com/mijahel/backend/entity/MovimientoInventario.java
 M Backend/src/main/java/com/mijahel/backend/entity/Producto.java
 M Backend/src/main/java/com/mijahel/backend/entity/Venta.java
 M Backend/src/main/java/com/mijahel/backend/repository/ProductoRepository.java
 M Backend/src/main/java/com/mijahel/backend/security/JwtAuthFilter.java
 M Backend/src/main/java/com/mijahel/backend/security/SecurityConfig.java
 M Backend/src/main/java/com/mijahel/backend/service/ClienteComercialService.java
 M Backend/src/main/java/com/mijahel/backend/service/ComercioService.java
 M Backend/src/main/resources/application.properties
 M Frontend/electron/main.cjs
 M Frontend/src/app/app.routes.ts
 M Frontend/src/app/core/layout/layout.ts
 M Frontend/src/app/core/models/comercio.model.ts
 M Frontend/src/app/core/services/comercio.service.ts
 M Frontend/src/app/features/inicio/inicio.html
 M Frontend/src/app/features/inicio/inicio.ts
 M Frontend/src/app/features/nueva-venta/nueva-venta.html
 M Frontend/src/app/features/nueva-venta/nueva-venta.spec.ts
 M Frontend/src/app/features/nueva-venta/nueva-venta.ts
 M Frontend/src/app/features/productos/productos.html
 M Frontend/src/app/features/productos/productos.ts
 M Frontend/src/app/features/reportes/reportes.ts
 M Frontend/src/app/features/ventas/ventas.html
?? Backend/src/main/java/com/mijahel/backend/controller/CatalogoPublicoController.java
?? Backend/src/main/java/com/mijahel/backend/controller/PedidoController.java
?? Backend/src/main/java/com/mijahel/backend/controller/TiendaController.java
?? Backend/src/main/java/com/mijahel/backend/dto/CatalogoPublicoDTO.java
?? Backend/src/main/java/com/mijahel/backend/dto/TiendaDTO.java
?? Backend/src/main/java/com/mijahel/backend/entity/CuentaCliente.java
?? Backend/src/main/java/com/mijahel/backend/entity/DetallePedido.java
?? Backend/src/main/java/com/mijahel/backend/entity/Pedido.java
?? Backend/src/main/java/com/mijahel/backend/exception/CatalogoPublicoExceptionHandler.java
?? Backend/src/main/java/com/mijahel/backend/repository/CuentaClienteRepository.java
?? Backend/src/main/java/com/mijahel/backend/repository/DetallePedidoRepository.java
?? Backend/src/main/java/com/mijahel/backend/repository/PedidoRepository.java
?? Backend/src/main/java/com/mijahel/backend/security/ClienteJwtFilter.java
?? Backend/src/main/java/com/mijahel/backend/security/ClienteJwtService.java
?? Backend/src/main/java/com/mijahel/backend/service/CatalogoPublicoService.java
?? Backend/src/main/java/com/mijahel/backend/service/CuentaClienteService.java
?? Backend/src/main/java/com/mijahel/backend/service/PedidoService.java
?? Backend/src/main/resources/db/migration/V3__catalogo_publico.sql
?? Backend/src/main/resources/db/migration/V4__pedidos_web.sql
?? Backend/src/test/java/com/mijahel/backend/service/CatalogoPublicoIT.java
?? Backend/src/test/java/com/mijahel/backend/service/PedidoWebIT.java
?? Frontend/electron/pedidos-smoke.cjs
?? Frontend/src/app/features/pedidos-web/
?? Frontend/src/app/features/reportes/reportes.html
?? Web/
```
