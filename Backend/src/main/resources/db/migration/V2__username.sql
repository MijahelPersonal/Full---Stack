-- Aditiva e idempotente: nunca modifica contraseñas, roles ni datos anteriores.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS username varchar(80);;
ALTER TABLE usuarios ALTER COLUMN email DROP NOT NULL;;
DO $$
DECLARE u record; base text; candidato text; sufijo integer;
BEGIN
  LOCK TABLE usuarios IN EXCLUSIVE MODE;
  FOR u IN SELECT id,nombre FROM usuarios WHERE username IS NULL OR btrim(username)='' ORDER BY id LOOP
    base := regexp_replace(translate(lower(coalesce(u.nombre,'')),'áéíóúüñ','aeiouun'),'[^a-z0-9._-]+','.','g');
    base := left(regexp_replace(base,'^[^a-z0-9]+|[.]+$','','g'),64);
    IF base='' THEN base:='usuario'; END IF;
    candidato:=base; sufijo:=1;
    WHILE EXISTS(SELECT 1 FROM usuarios WHERE username=candidato) LOOP
      sufijo:=sufijo+1; candidato:=base||'_'||sufijo;
    END LOOP;
    UPDATE usuarios SET username=candidato WHERE id=u.id;
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='usuarios_username_formato' AND conrelid='usuarios'::regclass) THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_username_formato CHECK(username=lower(username) AND username ~ '^[a-z0-9][a-z0-9._-]{0,79}$');
  END IF;
END $$;;
ALTER TABLE usuarios ALTER COLUMN username SET NOT NULL;;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_username_unique ON usuarios(username);;
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='usuarios_username_unique' AND conrelid='usuarios'::regclass) THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_username_unique UNIQUE USING INDEX usuarios_username_unique;
  END IF;
END $$;;
