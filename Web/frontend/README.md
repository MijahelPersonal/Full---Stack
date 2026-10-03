# STRUCH · tienda pública

Astro SSR + Tailwind + TypeScript. Angular/Electron sigue siendo el sistema interno, con su JWT y lógica de ventas. La tienda consulta exclusivamente la API pública de Spring Boot; no accede a PostgreSQL, credenciales ni endpoints administrativos.

## Ejecutar

Requisitos: Node 24, PostgreSQL y backend habitual en http://localhost:8080.

```powershell
cd Web/frontend
npm ci
npm run dev
```

Abrir http://localhost:4321. Para otro backend configurar API_URL en .env (ver .env.example), o en el entorno del proceso compilado:

```powershell
npm run build
$env:API_URL='http://localhost:8080'
$env:HOST='127.0.0.1'
$env:PORT='4321'
npm start
```

API_URL es una variable del servidor. En producción usar HTTPS delante del adaptador Node. El catálogo, las sugerencias y las imágenes se sirven por el mismo origen; no requieren abrir CORS para peticiones privadas.

## Rutas

| Ruta               | Contenido                                                                |
| ------------------ | ------------------------------------------------------------------------ |
| /                  | Banners, categorías, destacados, ofertas, novedades, marcas y beneficios |
| /productos         | Búsqueda, filtros, orden y paginación                                    |
| /categorias        | Categorías del inventario y conteos reales                               |
| /categorias/[slug] | Catálogo filtrado por categoría                                          |
| /producto/[slug]   | Ficha, imagen, características, precio, stock y selección                |
| /ofertas           | Productos con precio anterior mayor al vigente                           |
| /novedades         | Orden por fecha de creación                                              |
| /marcas            | Marcas presentes en el catálogo                                          |
| /arma-tu-pc        | Selección de familias; configurador de compatibilidad pendiente          |
| /contacto          | WhatsApp, correo y ayuda                                                 |
| /carrito           | Selección local con cantidades, subtotales y eliminación                 |
| /finalizar-compra  | Revisión de selección; no registra pedidos ni pagos                      |
| /cuenta            | Pantallas de cuenta, registro y pedidos todavía no habilitados           |

Cuenta de cliente, pedidos, pagos y compatibilidad de componentes requieren otra etapa de backend. Sus pantallas lo explican y no envían datos ni simulan operaciones exitosas. No se reutiliza el login de empleados para compradores. Dirección, horarios y redes sociales pendientes de confirmar.

## Catálogo real

La API pública de Spring Boot es la única fuente de productos, facetas, precio y stock. No existe catálogo local ni fallback comercial. Cero productos activos en PostgreSQL significa cero productos en Astro. Una API inaccesible muestra un error 503 diferente del estado vacío. El catálogo SSR y sus adaptadores de búsqueda/carrito usan no-store; al recargar se consultan los datos actuales.

Las imágenes anteriores se conservan en Web/demo-product-images y la nueva colección manual está en Web/product-images-library. Ambas carpetas están fuera del frontend publicado, no se importan y no generan productos. Elige una imagen desde el formulario de Angular/Electron: Spring Boot guarda el archivo y su ruta en PostgreSQL; Astro muestra la referencia devuelta por la API. Los tres banners decorativos del hero siguen siendo recursos visuales independientes del inventario.

El carrito consulta nuevamente precio, stock y estado público al abrirse. Reduce cantidades al stock vigente y retira productos inexistentes/inactivos. Persistencia y favoritos locales limitados a 30 líneas y 100 identificadores. No garantiza ni reserva stock: al habilitar pedidos, la validación definitiva deberá realizarla Spring Boot en una transacción.

## API y seguridad

Solo GET anónimo: /api/public/productos, /api/public/productos/{slug}, /api/public/productos/destacados, /api/public/productos/ofertas, /api/public/categorias y /api/public/marcas. Filtros: q, categoria, marca, disponibilidad, min, max, orden, pagina, tamano, destacado y oferta. La URL de búsqueda de la tienda acepta search y traduce al parámetro q existente.

El DTO público excluye precio de compra, SKU interno, stock mínimo, usuarios, clientes, ventas y movimientos. /api/buscar y /api/carrito son adaptadores Astro de lectura de ese contrato. Las imágenes /media/[UUID.ext]?w=320|640|960 validan nombres y consultan únicamente el backend configurado, con límites de 2 MB/16 megapíxeles y caché Sharp de 32 MB.

## Diseño y rendimiento

Identidad negro/blanco/naranja; header de tres niveles, mega menú, drawer móvil y catálogo responsive. Imágenes originales y prompts documentados en ASSETS.md. Astro genera WebP para los banners y un atlas compartido para las ocho ilustraciones. Fotos reales usan srcset y lazy loading; imagen principal priorizada. Sin fuentes remotas en la tienda, WebGL, Three.js, GSAP ni framework cliente.

Interacciones delegadas, un temporizador del slider y un IntersectionObserver por documento. El motor compartido de inercia tiene como máximo un requestAnimationFrame pendiente y se detiene al converger. Hero, tarjetas visibles y botones seleccionados usan transformaciones y variables CSS, sin renders de framework. Pausa con pestaña oculta, fuera de viewport, hover, foco y reduced motion. Los efectos de cursor requieren mouse y ancho mayor a 760 px. AbortController libera listeners y cancela solicitudes/timers al salir; páginas restauradas por bfcache inicializan una sola vez. Consultas de facetas y carrito limitadas a cuatro solicitudes concurrentes.

La revisión de movimiento, archivos y mediciones se documenta en REFINAMIENTO.md. El diagnóstico opcional STRUCH_MOTION_DIAGNOSTICS=1 agrega métricas al atributo data-motion-metrics del documento; está desactivado normalmente y no transmite datos.

## Verificación

```powershell
npm run build
npm test
# Con tienda y backend ejecutados, incluye comprobación HTTP de rutas y enlaces:
$env:STORE_TEST_URL='http://localhost:4321'
npm test
```

No existe script lint. astro check valida Astro/TypeScript y Prettier conserva el formato. Los tests cubren cantidades/stock, precisión de totales, almacenamiento manipulado, actualización de carrito, filtros, API única, fallos de conexión, rutas y endpoints locales. Ver LIMPIEZA-FULL-STACK.md para la validación actual y los pasos de la prueba manual.

Pruebas de backend únicamente sobre gestor_mvp_test:

```powershell
.\mvnw.cmd test '-Dspring.datasource.url=jdbc:postgresql://localhost:5432/gestor_mvp_test' '-Dtest=CatalogoPublicoIT,UsernameMigrationIT,JwtAuthFilterTest,JwtUsuarioEstadoIT,ComercioServiceIT,ServicioServiceTest,BackendApplicationTests'
```

Las fixtures visuales/HTTP se crean exclusivamente en esa base aislada y con carpeta de uploads separada. No cargar productos ilustrativos en gestor_db.
