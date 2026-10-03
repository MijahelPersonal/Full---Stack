-- Ejecutar únicamente en una base cloud nueva, después de las migraciones.
-- psql -v admin_username=... -v admin_hash=... -f crear-admin.sql
-- admin_hash es BCrypt de una contraseña nueva, no la contraseña en texto.
BEGIN;
LOCK TABLE usuarios IN EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM usuarios) THEN
  RAISE EXCEPTION 'La base ya contiene usuarios: no crear administrador inicial';
 END IF;
END $$;
INSERT INTO usuarios(id,nombre,username,password_hash,rol,activo)
VALUES(gen_random_uuid(),'Administrador',:'admin_username',:'admin_hash','ADMINISTRADOR',true);
COMMIT;
