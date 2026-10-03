-- Extensión aditiva; no altera precios, stock ni historial existente.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS slug varchar(128);;
UPDATE productos SET slug=coalesce(nullif(left(trim(both '-' from regexp_replace(translate(lower(nombre),'áéíóúüñ','aeiouun'),'[^a-z0-9]+','-','g')),80),''),'producto')||'-'||id::text WHERE slug IS NULL;;
ALTER TABLE productos ALTER COLUMN slug SET NOT NULL;;
CREATE UNIQUE INDEX IF NOT EXISTS productos_slug_unique ON productos(slug);;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS descripcion text NOT NULL DEFAULT '';;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS especificaciones jsonb NOT NULL DEFAULT '{}'::jsonb;;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS destacado boolean NOT NULL DEFAULT false;;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_anterior numeric(14,2);;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS creado_en timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;;
CREATE INDEX IF NOT EXISTS idx_productos_publicos_fecha ON productos(creado_en DESC,id) WHERE activo;;
CREATE INDEX IF NOT EXISTS idx_productos_publicos_precio ON productos(precio_venta,id) WHERE activo;;
