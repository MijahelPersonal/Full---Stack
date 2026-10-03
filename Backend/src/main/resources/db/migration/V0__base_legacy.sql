-- Esquema base anterior al MVP. Aditivo: no altera tablas ya existentes ni carga usuarios.

CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid NOT NULL,
    direccion character varying(255),
    latitud numeric(38,2),
    longitud numeric(38,2),
    nombre character varying(255),
    telefono character varying(255)
);;

CREATE TABLE IF NOT EXISTS public.historial_servicio (
    id uuid NOT NULL,
    estado_anterior character varying(255),
    estado_nuevo character varying(255),
    fecha timestamp(6) without time zone,
    observacion character varying(255),
    servicio_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    CONSTRAINT historial_servicio_estado_anterior_check CHECK (((estado_anterior)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'ASIGNADO'::character varying, 'EN_RUTA'::character varying, 'EN_SERVICIO'::character varying, 'FINALIZADO'::character varying])::text[]))),
    CONSTRAINT historial_servicio_estado_nuevo_check CHECK (((estado_nuevo)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'ASIGNADO'::character varying, 'EN_RUTA'::character varying, 'EN_SERVICIO'::character varying, 'FINALIZADO'::character varying])::text[])))
);;

CREATE TABLE IF NOT EXISTS public.materiales (
    id uuid NOT NULL,
    categoria character varying(255),
    nombre character varying(255) NOT NULL,
    stock_actual integer NOT NULL,
    stock_minimo integer NOT NULL,
    unidad_medida character varying(255)
);;

CREATE TABLE IF NOT EXISTS public.servicio_material (
    id uuid NOT NULL,
    cantidad_solicitada integer NOT NULL,
    cantidad_utilizada integer NOT NULL,
    material_id uuid NOT NULL,
    servicio_id uuid NOT NULL
);;

CREATE TABLE IF NOT EXISTS public.servicios (
    id uuid NOT NULL,
    descripcion character varying(255),
    estado character varying(255),
    fecha_creacion timestamp(6) without time zone,
    fecha_programada timestamp(6) without time zone,
    prioridad character varying(255),
    tipo character varying(255),
    cliente_id uuid NOT NULL,
    tecnico_id uuid,
    CONSTRAINT servicios_estado_check CHECK (((estado)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'ASIGNADO'::character varying, 'EN_RUTA'::character varying, 'EN_SERVICIO'::character varying, 'FINALIZADO'::character varying])::text[]))),
    CONSTRAINT servicios_prioridad_check CHECK (((prioridad)::text = ANY ((ARRAY['BAJA'::character varying, 'MEDIA'::character varying, 'ALTA'::character varying])::text[]))),
    CONSTRAINT servicios_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['INSTALACION'::character varying, 'MANTENIMIENTO'::character varying, 'REPARACION'::character varying])::text[])))
);;

CREATE TABLE IF NOT EXISTS public.tecnicos (
    id uuid NOT NULL,
    especialidad character varying(255),
    estado_disponibilidad character varying(255),
    usuario_id uuid NOT NULL,
    CONSTRAINT tecnicos_estado_disponibilidad_check CHECK (((estado_disponibilidad)::text = ANY ((ARRAY['DISPONIBLE'::character varying, 'EN_SERVICIO'::character varying, 'INACTIVO'::character varying])::text[])))
);;

CREATE TABLE IF NOT EXISTS public.usuarios (
    id uuid NOT NULL,
    direccion character varying(255),
    latitud numeric(38,2),
    longitud numeric(38,2),
    nombre character varying(255),
    telefono character varying(255),
    activo boolean NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(255),
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['ADMINISTRADOR'::character varying, 'SUPERVISOR'::character varying, 'TECNICO'::character varying])::text[])))
);;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='clientes_pkey' AND conrelid='public.clientes'::regclass) THEN ALTER TABLE public.clientes ADD CONSTRAINT clientes_pkey PRIMARY KEY (id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='historial_servicio_pkey' AND conrelid='public.historial_servicio'::regclass) THEN ALTER TABLE public.historial_servicio ADD CONSTRAINT historial_servicio_pkey PRIMARY KEY (id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='materiales_pkey' AND conrelid='public.materiales'::regclass) THEN ALTER TABLE public.materiales ADD CONSTRAINT materiales_pkey PRIMARY KEY (id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='servicio_material_pkey' AND conrelid='public.servicio_material'::regclass) THEN ALTER TABLE public.servicio_material ADD CONSTRAINT servicio_material_pkey PRIMARY KEY (id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='servicios_pkey' AND conrelid='public.servicios'::regclass) THEN ALTER TABLE public.servicios ADD CONSTRAINT servicios_pkey PRIMARY KEY (id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='tecnicos_pkey' AND conrelid='public.tecnicos'::regclass) THEN ALTER TABLE public.tecnicos ADD CONSTRAINT tecnicos_pkey PRIMARY KEY (id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ukitfix4axvy614xr4hgfhmv7jm' AND conrelid='public.tecnicos'::regclass) THEN ALTER TABLE public.tecnicos ADD CONSTRAINT ukitfix4axvy614xr4hgfhmv7jm UNIQUE (usuario_id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ukkfsp0s1tflm1cwlj8idhqsad0' AND conrelid='public.usuarios'::regclass) THEN ALTER TABLE public.usuarios ADD CONSTRAINT ukkfsp0s1tflm1cwlj8idhqsad0 UNIQUE (email); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='usuarios_pkey' AND conrelid='public.usuarios'::regclass) THEN ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='fk2xiolrscg38eoxtgssm1lk32e' AND conrelid='public.servicios'::regclass) THEN ALTER TABLE public.servicios ADD CONSTRAINT fk2xiolrscg38eoxtgssm1lk32e FOREIGN KEY (tecnico_id) REFERENCES public.tecnicos(id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='fk4n0e9x062a523i2qk76pphjq8' AND conrelid='public.servicio_material'::regclass) THEN ALTER TABLE public.servicio_material ADD CONSTRAINT fk4n0e9x062a523i2qk76pphjq8 FOREIGN KEY (servicio_id) REFERENCES public.servicios(id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='fk5k40y0ey88gjf99u844didvss' AND conrelid='public.servicio_material'::regclass) THEN ALTER TABLE public.servicio_material ADD CONSTRAINT fk5k40y0ey88gjf99u844didvss FOREIGN KEY (material_id) REFERENCES public.materiales(id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='fkedbo9abyj6eppxugwx6g4tbqu' AND conrelid='public.historial_servicio'::regclass) THEN ALTER TABLE public.historial_servicio ADD CONSTRAINT fkedbo9abyj6eppxugwx6g4tbqu FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='fkgn7oja6gsjxub7wp1v2f2act9' AND conrelid='public.historial_servicio'::regclass) THEN ALTER TABLE public.historial_servicio ADD CONSTRAINT fkgn7oja6gsjxub7wp1v2f2act9 FOREIGN KEY (servicio_id) REFERENCES public.servicios(id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='fkh0hbi1db3op7h3fjd8u6rhm8l' AND conrelid='public.tecnicos'::regclass) THEN ALTER TABLE public.tecnicos ADD CONSTRAINT fkh0hbi1db3op7h3fjd8u6rhm8l FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id); END IF; END $$;;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='fkla1o94ktspcn6j4o27ma3obr6' AND conrelid='public.servicios'::regclass) THEN ALTER TABLE public.servicios ADD CONSTRAINT fkla1o94ktspcn6j4o27ma3obr6 FOREIGN KEY (cliente_id) REFERENCES public.clientes(id); END IF; END $$;;
