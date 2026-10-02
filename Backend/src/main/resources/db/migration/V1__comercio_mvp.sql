-- MVP aditivo: conserva todas las tablas y datos anteriores.
CREATE TABLE IF NOT EXISTS productos (id uuid PRIMARY KEY,
sku varchar(80) NOT NULL UNIQUE,
nombre varchar(160) NOT NULL,
categoria varchar(80) NOT NULL,
marca varchar(80) NOT NULL,
precio_compra numeric(14,2) NOT NULL CHECK(precio_compra>=0),
precio_venta numeric(14,2) NOT NULL CHECK(precio_venta>0),
stock integer NOT NULL CHECK(stock>=0),
stock_minimo integer NOT NULL CHECK(stock_minimo>=0),
activo boolean NOT NULL
);;
CREATE TABLE IF NOT EXISTS ventas (id uuid PRIMARY KEY,
numero varchar(255) NOT NULL UNIQUE,
cliente_id uuid NOT NULL REFERENCES clientes(id),
cliente_nombre varchar(255) NOT NULL,
vendedor_id uuid NOT NULL REFERENCES usuarios(id),
vendedor_nombre varchar(255) NOT NULL,
total numeric(14,2) NOT NULL CHECK(total>0),
estado varchar(255) NOT NULL,
clave uuid NOT NULL UNIQUE,
fecha timestamp NOT NULL
);;
CREATE TABLE IF NOT EXISTS detalle_ventas (id uuid PRIMARY KEY,
venta_id uuid NOT NULL REFERENCES ventas(id),
producto_id uuid NOT NULL REFERENCES productos(id),
sku varchar(255) NOT NULL,
nombre varchar(255) NOT NULL,
cantidad integer NOT NULL CHECK(cantidad>0),
precio_unitario numeric(14,2) NOT NULL,
subtotal numeric(14,2) NOT NULL
);;
CREATE TABLE IF NOT EXISTS movimientos_inventario (id uuid PRIMARY KEY,
producto_id uuid NOT NULL REFERENCES productos(id),
producto_nombre varchar(255) NOT NULL,
tipo varchar(255) NOT NULL CHECK(tipo IN ('ENTRADA','SALIDA')),
cantidad integer NOT NULL CHECK(cantidad>0),
stock_anterior integer NOT NULL CHECK(stock_anterior>=0),
stock_posterior integer NOT NULL CHECK(stock_posterior>=0),
motivo varchar(255) NOT NULL,
venta_id uuid REFERENCES ventas(id),
responsable varchar(255) NOT NULL,
fecha timestamp NOT NULL
);;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS documento varchar(255);;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS correo varchar(255);;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('ADMINISTRADOR','SUPERVISOR','TECNICO','VENDEDOR'));;
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);;
CREATE INDEX IF NOT EXISTS idx_detalles_venta ON detalle_ventas(venta_id);;
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_inventario(producto_id,fecha);;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url varchar(255);;
