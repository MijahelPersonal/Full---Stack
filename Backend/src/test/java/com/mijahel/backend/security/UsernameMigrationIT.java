package com.mijahel.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties="spring.jpa.show-sql=false")
class UsernameMigrationIT {
 @Autowired DataSource dataSource;
 @Autowired Environment environment;
 @Test void migraCoincidenciasSinCambiarDatosYEsIdempotente() throws Exception {
  assertTrue(environment.getProperty("spring.datasource.url", "").endsWith("/gestor_mvp_test"));
  try(Connection c=dataSource.getConnection()) {
   c.setAutoCommit(false);
   try {
    String schema="username_test_"+UUID.randomUUID().toString().replace("-", "");
    c.createStatement().execute("CREATE SCHEMA "+schema);
    c.createStatement().execute("SET LOCAL search_path TO "+schema);
    c.createStatement().execute("CREATE TABLE usuarios(id uuid PRIMARY KEY, nombre text, email text NOT NULL, password_hash text, rol text, activo boolean)");
    c.createStatement().execute("INSERT INTO usuarios VALUES ('00000000-0000-0000-0000-000000000001','José Pérez','a@local.test','hash-a','ADMINISTRADOR',true),('00000000-0000-0000-0000-000000000002','José Pérez','b@local.test','hash-b','VENDEDOR',false),('00000000-0000-0000-0000-000000000003','','c@local.test','hash-c','TECNICO',true)");
    String before=datos(c);
    String script=new ClassPathResource("db/migration/V2__username.sql").getContentAsString(StandardCharsets.UTF_8);
    ejecutar(c,script);
    assertEquals(before,datos(c));
    var rows=c.createStatement().executeQuery("SELECT username FROM usuarios ORDER BY id");
    assertTrue(rows.next());assertEquals("jose.perez",rows.getString(1));
    assertTrue(rows.next());assertEquals("jose.perez_2",rows.getString(1));
    assertTrue(rows.next());assertEquals("usuario",rows.getString(1));
    ejecutar(c,script);
    assertEquals(before,datos(c));
    var count=c.createStatement().executeQuery("SELECT count(*) FROM pg_constraint WHERE conrelid='usuarios'::regclass AND contype='u'");
    assertTrue(count.next());assertEquals(1,count.getInt(1));
    var savepoint=c.setSavepoint();
    assertThrows(java.sql.SQLException.class,()->c.createStatement().execute("UPDATE usuarios SET username='jose.perez' WHERE username='jose.perez_2'"));
    c.rollback(savepoint);
    c.createStatement().execute("UPDATE usuarios SET email=NULL WHERE username='usuario'");
   } finally {c.rollback();}
  }
 }
 private void ejecutar(Connection c,String script) throws Exception {
  for(String statement:script.split(";;")) if(!statement.isBlank()) c.createStatement().execute(statement);
 }
 private String datos(Connection c) throws Exception {
  var rs=c.createStatement().executeQuery("SELECT string_agg(id::text||coalesce(nombre,'')||email||password_hash||rol||activo::text,'|' ORDER BY id) FROM usuarios");
  rs.next();return rs.getString(1);
 }
}
