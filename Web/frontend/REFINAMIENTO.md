# Refinamiento STRUCH · 2 de octubre de 2026

Registro histórico de la pasada de movimiento. La limpieza posterior del catálogo y las bibliotecas manuales se documenta en LIMPIEZA-FULL-STACK.md; el catálogo demo anterior ya no está habilitado.

Se conserva el branding, las fotografías, el diseño de tarjetas, el layout y el orden de secciones. Esta pasada modifica solamente la tienda Astro; los cambios anteriores de Spring Boot y Angular permanecen en el working tree.

## Archivos de esta pasada

Modificados: src/components/Header.astro, src/components/Hero.astro, src/layouts/Layout.astro, src/styles/struch.css, src/scripts/storefront.ts, src/lib/shared.ts, src/pages/api/buscar.ts, tests/storefront.test.mjs y README.md.

Creados: src/lib/animation-loop.ts, src/scripts/motion.ts, src/scripts/motion-diagnostics.ts, src/styles/motion.css, tests/motion.test.mjs y este documento.

El selector duplicado desaparece del buscador central. La regla global input:focus-visible era la causa del borde cuadrado; ahora excluye #site-search y el foco corresponde al contenedor completo con radio de 8 px. Los filtros del catálogo conservan su selector de categoría.

Movimiento: header sin animar dimensiones, hero con inercia y parallax moderados, crossfade de banners, mega menú, categorías, tilt/glow de tarjetas, botones magnéticos seleccionados, reveals una sola vez y pulsos breves de carrito/favoritos. La entrada de página usa CSS durante 250 ms sin interceptar enlaces. Se descartó la transición nativa entre documentos porque el navegador integrado registró InvalidStateError al abortarla durante las pruebas; no se retrasa la salida. No se incorporan dependencias ni carruseles de marcas permanentes.

## Validación

- npm run build: 43 archivos revisados, cero errores, warnings o hints.
- STORE_TEST_URL=http://localhost:4323 npm test: 16/16 aprobadas, incluyendo rutas HTTP, búsqueda y carrito contra el backend habitual.
- Prettier: todos los archivos Astro/TypeScript/CSS y tests correctos. No existe script lint.
- Navegador: foco redondeado, búsqueda RTX y categoría relacionada, Escape, Enter, apertura/cierre repetidos de categorías, cambio de banners, movimientos reales del cursor en hero y tarjetas, scroll y carrito con eliminación del artículo de prueba.
- Responsive: comprobación a 320, 390 y 800 px sin desbordamiento horizontal del documento; drawer y acordeón móvil funcionales. Los efectos de cursor se desactivan en el breakpoint móvil.
- Consola de la versión corregida: sin errores o advertencias registrados.

Se corrigió durante la prueba una llamada RAF sin receptor Window (Illegal invocation) y se agregó una prueba de regresión. También se evita que una búsqueda pendiente reabra el dropdown después de cerrarlo.

## Rendimiento y límites de las mediciones

La prueba utilizó el servidor compilado, sin HMR, con diagnóstico opcional. Se repitieron interacciones durante varios minutos y se muestrearon procesos durante unos seis minutos. El diagnóstico no guarda un historial creciente: reemplaza una sola muestra en el DOM. Su timer y PerformanceObserver se limpian junto al documento y se pausan al ocultar la página.

En el documento probado, el heap JS bajó naturalmente de aproximadamente 11,3 MiB a 5,4 MiB y luego osciló con las interacciones. En la revisión posterior del motor final también bajó de aproximadamente 20,9 MiB a 14,5 MiB. No se forzó GC. No se observó crecimiento continuo durante esta prueba; esto no constituye una garantía de ausencia de fugas en cualquier sesión futura.

El motor mantuvo como máximo un RAF pendiente, cero en reposo, un observer y un número constante de listeners por documento (10 en la versión final). La cadencia registrada durante interacción fue aproximadamente 131–141 callbacks RAF/s en este equipo; mide cadencia del motor, no certifica FPS de composición de GPU. Se registraron cero long tasks en las muestras y pocos intervalos superiores a 25 ms.

La muestra de procesos corresponde a renderers compartidos de la aplicación de escritorio y no permite atribuir toda la RAM o CPU exclusivamente a STRUCH. Dos renderers observados consumieron respectivamente 2,03 y 0,05 segundos de CPU en aproximadamente 352 segundos, con RSS de 115,5→127,3 MiB y 117→117 MiB. Las variaciones de caché y el resto de pestañas limitan la interpretación. El heap por documento y los contadores de recursos son la evidencia específica de la tienda.

Para repetir el diagnóstico: compilar, iniciar con STRUCH_MOTION_DIAGNOSTICS=1 y observar data-motion-metrics mientras se repiten las interacciones. En el servidor habitual la variable debe omitirse. No se hizo commit, push ni merge.
