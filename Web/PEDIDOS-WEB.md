# Flujo de pedidos STRUCH → Gestión

Implementado sobre `feature/tienda-web`, sin commit, push ni merge. Las categorías existentes y el catálogo maestro no se reorganizaron.

## 1. Arquitectura

STRUCH/Astro mantiene su diseño y carrito local. Registro y login se envían mediante endpoints propios de Astro a Spring Boot. El JWT de cliente permanece en una cookie HttpOnly, SameSite=Lax y Secure bajo HTTPS; no se devuelve al JavaScript del navegador ni se almacena en localStorage. Las peticiones que modifican datos comprueban el Origin exacto en Astro. Las vistas privadas y llamadas al backend usan no-store.

Spring Boot conserva la autenticación de empleados por username. Las cuentas públicas utilizan email, BCrypt y una clave de firma derivada con HMAC para un propósito distinto del JWT interno; además exigen un issuer propio. Hay dos cadenas de seguridad. Un token de cliente no autentica al backoffice y un token interno no autentica a un cliente. Se consulta el estado actual de CuentaCliente y Cliente en cada petición autenticada pública. La validación existente de usuarios internos activos se conserva.

Las contraseñas públicas requieren al menos 8 caracteres y como máximo 72 bytes para BCrypt. Registro crea un Cliente asociado; no vincula cuentas con clientes manuales solo porque coincida su correo. Esto evita tomar una identidad existente sin verificarla.

## 2. Entidades y migración

Nuevas: CuentaCliente, Pedido y DetallePedido, con sus repositorios. CuentaCliente guarda clienteId, email normalizado único, passwordHash, activo y fechaCreacion. El hash no se serializa. Pedido guarda número, código aleatorio de recojo, estado, fechas, total calculado por servidor y ventaId opcional. DetallePedido conserva SKU, nombre, cantidad y precio históricos.

Modificadas: Venta incorpora origen POS/WEB; clienteId pasa a ser opcional para público general. MovimientoInventario incorpora pedidoId. Cliente incorpora nombres/apellidos opcionales para registros públicos y conserva nombre completo para compatibilidad con Gestión. Si un cliente tiene una cuenta o pedidos, eliminarlo lo inactiva y conserva sus referencias e historial.

V4__pedidos_web.sql crea tablas e índices, agrega columnas y relaja exclusivamente el NOT NULL de ventas.cliente_id. No elimina tablas, filas ni relaciones existentes. Los datos históricos de ventas conservan origen POS. Se ejecuta mediante el inicializador SQL existente junto con V1–V3 y Hibernate valida el esquema. Las sentencias son repetibles.

## 3. Endpoints

Públicos para autenticación:

- POST /api/tienda/auth/registro
- POST /api/tienda/auth/login

Solo con sesión de cliente web:

- GET /api/tienda/cuenta
- GET /api/tienda/pedidos
- GET /api/tienda/pedidos/{id} (solo propios; ajenos responden 404)
- POST /api/tienda/pedidos (clave UUID y líneas con productoId/cantidad)

Internos, con los roles actuales:

- GET /api/pedidos-web?estado=...
- GET /api/pedidos-web/{id}
- GET /api/pedidos-web/codigo?codigo=...
- POST /api/pedidos-web/{id}/confirmar (Administrador)
- POST /api/pedidos-web/{id}/listo (Administrador)
- POST /api/pedidos-web/{id}/cancelar (Administrador)
- POST /api/pedidos-web/{id}/entregar (Administrador, Vendedor o Supervisor)
- GET /api/reportes/resumen?periodo=HOY|7DIAS|MES
- POST /api/ventas admite clienteId null y siempre registra origen POS

Astro expone POST /api/cuenta/login, registro, logout y pedido como intermediarios del mismo origen. El logout elimina la cookie; no añade una lista global de revocación de tokens. Los JWT expiran en 24 horas y una cuenta inactiva se rechaza inmediatamente.

## 4. Pantallas Angular/Electron

Nuevo módulo Pedidos web: filtros por estado, búsqueda por código, listado, detalle con disponibilidad actual, confirmación, preparación, cancelación y entrega con controles por rol. La navegación es Inicio, Pedidos web, Venta en tienda, Productos, Inventario, Clientes, Ventas y Reportes.

Venta en tienda admite Público general. Ventas incorpora origen y mantiene solamente ventas finalizadas. Inicio muestra ventas del día, importe, pendientes, listos, stock bajo y listas compactas de ventas, pedidos por atender y reposición. Reportes consulta ventas reales por período, origen, productos más vendidos, stock bajo, pedidos pendientes actuales y entregados en el período. Productos e Inventario mantienen sus pantallas y lógica.

## 5. Pantallas Astro

Mi cuenta tiene registro, login, logout e historial. Finalizar pedido exige sesión y muestra el carrito real con recojo en tienda. La constancia /pedidos/{id} muestra código, cliente, fecha, productos, total y estado; incluye impresión y guardado PDF a través del diálogo del navegador. Actualizar esa página solo realiza GET. Header refleja la sesión y Contacto/footer describen la modalidad real de recojo.

No se añadieron frameworks, pagos, delivery, facturación ni animaciones. Los listeners nuevos del checkout utilizan el AbortController existente. Las mutaciones concurrentes del carrito se bloquean mientras se envía el pedido.

## 6–8. Pruebas y compilaciones

- Spring Boot: 35 pruebas, 0 fallos, 0 errores. Incluyen los 7 casos integrados de PedidoWebIT y la regresión de comercio, catálogo, username, JWT y servicios antiguos. Todas las pruebas de persistencia se ejecutaron en gestor_mvp_test.
- Angular: 21 pruebas en 12 archivos, todas aprobadas. Compilación web y desktop aprobadas. Advertencia existente: login.scss 5.52 kB frente al presupuesto de 4 kB; no pertenece al flujo de pedidos.
- Astro: compilación final con 0 errores, 0 warnings y 0 hints. 22 pruebas aprobadas y 2 omitidas porque requieren sesiones especiales de base vacía/API desconectada. Esas condiciones también tienen pruebas unitarias activas. La suite de esta etapa incluye HTTP real de registro, login, cookie, checkout, reintento, constancia, logout y aislamiento.
- Electron: smoke compilado y desarrollo aprobados. Login, dashboard, API protegida, Pedidos web, Reportes y Público general funcionan. nodeIntegration=false, contextIsolation=true, sandbox=true.
- Consola de las pantallas comprobadas: sin errores ni warnings registrados.

## 9. Prueba completa desde las pantallas

Se creó una Memoria Kingston 16 GB de S/720 y stock 10 exclusivamente en la base aislada. Se registró Juan Pérez en STRUCH, se agregó una unidad al carrito y se confirmó el pedido. Código observado: STR-20261003-GLVY4RCSZS.

Gestión mostró PENDIENTE y stock 10. Confirmar dejó disponibilidad 9. Marcar listo se reflejó en la constancia de STRUCH. Entregar registró ENTREGADO y una Venta WEB de S/720 con su detalle. Ventas, Reportes e historial del cliente mostraron la operación. Refrescar conservó el mismo pedido. La evidencia visual quedó guardada fuera del repositorio como struch-pedido-entregado.png. Los datos desechables de esta prueba se limpiaron solamente en gestor_mvp_test.

## 10. Reserva

PENDIENTE valida disponibilidad y calcula precios, pero no reserva. CONFIRMAR bloquea el pedido y luego los productos en orden UUID, valida nuevamente y registra SALIDA asociada al pedido. El campo stock representa disponibilidad; POS y catálogo usan ese mismo campo. La entrega no registra otra salida ni vuelve a descontar.

## 11. Cancelación

Cancelar pendiente no altera stock. Cancelar confirmado/listo registra ENTRADA con pedidoId y devuelve exactamente lo reservado. Pedido entregado o cancelado no admite otra cancelación. No se implementan devoluciones de ventas.

## 12. Duplicados y transacciones

Creación serializada por cuenta, clave UUID única por cuenta y comparación de IDs/cantidades. La misma solicitud devuelve el mismo pedido; una clave reutilizada con otra selección se rechaza. El intento del navegador se conserva en sessionStorage hasta recibir éxito.

Las transiciones bloquean el Pedido. Doble confirmación o entrega responden 409. La Venta se vincula una sola vez, con ventaId único y clave derivada del ID del pedido. Crear Venta, DetalleVenta y marcar entregado pertenecen a la misma transacción. Se probaron reintentos simultáneos, entregas simultáneas y rollback de reserva/entrega, sin escrituras parciales.

## 13. Permisos y casos negativos

Comprobados: stock insuficiente al crear; cambio de stock antes de confirmar; cancelación y reposición; código inexistente 404; doble confirmación/entrega 409; pedido ajeno 404; JWT público contra inventario/usuarios/reportes/administración 401; JWT interno contra cuenta pública 401; cliente desactivado 401; Vendedor consulta pero no confirma/prepara/cancela; POS respeta stock reservado y acepta público general.

La migración también se aplicó en el backend habitual localhost:8080. Se comparó el catálogo antes y después: sus dos productos conservaron exactamente IDs, categorías, precios, stock e imágenes. Login por username mijahel y endpoints internos siguen funcionando. No se crearon pedidos ni ventas de prueba en gestor_db.

## 14. Git y revisión

Rama: feature/tienda-web. Todos los cambios siguen sin staging, commit, push ni merge. git status incluye también el catálogo y Web pendientes desde etapas anteriores; no son todos cambios exclusivos de esta etapa. El estado final completo se entrega en un archivo aparte para evitar omitir el directorio Web no rastreado.

## Repetir las pruebas

Backend (desde Backend, utilizando el Maven/JDK de tu equipo):

```powershell
mvn test '-Dtest=*,*IT' '-Dspring.datasource.url=jdbc:postgresql://localhost:5432/gestor_mvp_test'
```

Angular: npm test -- --watch=false; npm run build; npm run build:desktop.

Astro: npm run build; npm test. Para HTTP real, iniciar una tienda de pruebas en 4322 con API_URL=http://localhost:8081, backend 8081 exclusivamente sobre gestor_mvp_test y un producto desechable de S/720 con stock suficiente. Definir PICKUP_TEST_URL, PICKUP_TEST_PRODUCT_ID y STORE_TEST_URL. No ejecutar estas pruebas de creación contra datos habituales. La prueba HTTP deja cuentas/pedidos desechables para inspección; limpiarlos antes de la suite legacy que restablece el catálogo aislado.

Electron: ejecutar smoke con GESTION_API_URL=http://localhost:8081/api, credenciales del administrador aislado y GESTION_TEST_PEDIDOS=1. Si Angular ya ocupa 4200, reutilizarlo con electron electron/main.cjs --dev --smoke. Las credenciales nunca se guardan en el código ni en este informe.

Para publicación, configurar HTTPS y una clave JWT privada mediante la configuración de despliegue; la cookie activa automáticamente Secure en HTTPS. La dirección física sigue pendiente de definición por la empresa: Contacto indica confirmar ubicación, sin inventar una dirección.
