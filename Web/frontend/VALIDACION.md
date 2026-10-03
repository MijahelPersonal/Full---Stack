# Validación del rediseño STRUCH

Registro histórico de la etapa de rediseño. La validación actual, tras retirar el catálogo demo y preparar las bibliotecas manuales, está en LIMPIEZA-FULL-STACK.md. Las ilustraciones comerciales anteriores ya no se utilizan en el runtime.

Fecha: 2 de octubre de 2026. Rama: feature/tienda-web. Sin commit, push ni merge.

- Astro check y build: cero errores, advertencias y hints.
- Tienda: 10 pruebas aprobadas contra el backend habitual (catálogo vacío) y contra el backend de prueba con catálogo real. Ocho pruebas de lógica y dos de integración HTTP, incluyendo recorrido de enlaces internos y respuestas 400/404.
- Spring Boot: 28 pruebas aprobadas, cero fallos; ejecutadas únicamente sobre gestor_mvp_test.
- Angular: 18 pruebas aprobadas. Build desktop aprobado.
- Electron: login mijahel, dashboard y petición protegida HTTP 200; nodeIntegration=false, contextIsolation=true, sandbox=true.
- Prueba HTTP real sobre gestor_mvp_test: seis productos, imágenes multipart/WebP, cambio de precio, salida de stock, preservación de campos comerciales desde el contrato Angular anterior, exclusión de inactivos y errores controlados. No se insertaron productos en gestor_db.
- Navegador: búsqueda con sugerencias y Enter, mega menú, drawer móvil, pestañas de producto, agregar/comprar hacia carrito, aumentar cantidades, persistencia tras recarga, eliminar y revisar selección. La revisión no registra pedidos.
- Todas las pantallas recorridas a 390 px sin desbordamiento; Contacto y Productos también a 320 px; carrito revisado a 800 px y escritorio. Viewport de prueba restaurado.
- Consola de la tienda: sin errores ni advertencias observados. Sin identidad Nexo visible ni colores turquesa/cyan del diseño anterior.
- Script del navegador: un archivo compilado de aproximadamente 17 KB sin framework cliente. Timers, listeners y observer se liberan al salir; no existe bucle requestAnimationFrame permanente. No se realizó un perfil prolongado de heap ni una certificación de 60 FPS en todos los dispositivos.
- No existe script lint; se ejecutaron astro check y formato Prettier.

## Límites pendientes

La advertencia existente del login Angular permanece: 5,52 KB de CSS frente a un presupuesto de 4 KB. No corresponde a la tienda Astro y no impide la compilación.

Cuenta/registro de clientes, pedidos, pagos y configuración de compatibilidad de PC requieren otra etapa. Sus interfaces indican que no están habilitados; no reutilizan el JWT interno ni simulan operaciones exitosas. Favoritos y carrito son locales; la disponibilidad se consulta, pero no se reserva stock.

Dirección, horarios y redes sociales no fueron proporcionados y permanecen por confirmar. WhatsApp y correo sí utilizan los canales indicados por el usuario.

## Cambios

Este rediseño se concentra en Web/frontend: layout, header/footer, componentes de catálogo/carrito, rutas independientes, estado comercial público, interacción delegada, CSS STRUCH, imágenes originales, pruebas y documentación. Se reemplazó el CSS anterior.

Los cambios de backend, migración pública y campos comerciales del formulario Angular ya pertenecían a las fases 1 y 2 de esta rama y permanecen sin commit. No se cambió su lógica para el rediseño.

Los PNG fuente y sus prompts están descritos en ASSETS.md; las fotos de los productos demo son ilustraciones genéricas y están identificadas.
