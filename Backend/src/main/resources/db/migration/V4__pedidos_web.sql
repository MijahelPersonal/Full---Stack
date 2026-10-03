-- Migración aditiva. Conserva ventas y clientes existentes.
ALTER TABLE ventas ALTER COLUMN cliente_id DROP NOT NULL;;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS origen varchar(3) NOT NULL DEFAULT 'POS' CHECK(origen IN ('POS','WEB'));;
CREATE TABLE IF NOT EXISTS cuentas_cliente(id uuid PRIMARY KEY,cliente_id uuid NOT NULL UNIQUE REFERENCES clientes(id),email varchar(160) NOT NULL UNIQUE,password_hash varchar(255) NOT NULL,activo boolean NOT NULL DEFAULT true,fecha_creacion timestamp NOT NULL);;
CREATE TABLE IF NOT EXISTS pedidos(id uuid PRIMARY KEY,cuenta_id uuid NOT NULL REFERENCES cuentas_cliente(id),cliente_id uuid NOT NULL REFERENCES clientes(id),cliente_nombre varchar(160) NOT NULL,clave uuid NOT NULL,numero_pedido varchar(64) NOT NULL UNIQUE,codigo_recojo varchar(40) NOT NULL UNIQUE,estado varchar(24) NOT NULL CHECK(estado IN ('PENDIENTE','CONFIRMADO','LISTO_PARA_RECOGER','ENTREGADO','CANCELADO')),total numeric(14,2) NOT NULL CHECK(total>0),venta_id uuid UNIQUE REFERENCES ventas(id),fecha_creacion timestamp NOT NULL,fecha_confirmacion timestamp,fecha_listo timestamp,fecha_entrega timestamp,UNIQUE(cuenta_id,clave),CHECK((estado='ENTREGADO')=(venta_id IS NOT NULL)));;
CREATE TABLE IF NOT EXISTS detalle_pedidos(id uuid PRIMARY KEY,pedido_id uuid NOT NULL REFERENCES pedidos(id),producto_id uuid NOT NULL REFERENCES productos(id),sku_historico varchar(80) NOT NULL,nombre_historico varchar(160) NOT NULL,cantidad integer NOT NULL CHECK(cantidad>0),precio_unitario numeric(14,2) NOT NULL CHECK(precio_unitario>0),subtotal numeric(14,2) NOT NULL CHECK(subtotal>0),UNIQUE(pedido_id,producto_id));;
ALTER TABLE movimientos_inventario ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES pedidos(id);;
CREATE INDEX IF NOT EXISTS pedidos_estado_fecha ON pedidos(estado,fecha_creacion DESC);;
CREATE INDEX IF NOT EXISTS pedidos_cuenta_fecha ON pedidos(cuenta_id,fecha_creacion DESC);;
CREATE INDEX IF NOT EXISTS detalle_pedidos_pedido ON detalle_pedidos(pedido_id);;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nombres varchar(80);;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS apellidos varchar(79);;
