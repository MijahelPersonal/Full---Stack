package com.mijahel.backend.security;

import com.mijahel.backend.entity.*;
import com.mijahel.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties="spring.jpa.show-sql=false")
class JwtUsuarioEstadoIT {
 @Autowired UsuarioRepository usuarios;
 @Autowired PasswordEncoder encoder;
 @Autowired Environment env;
 @Autowired ObjectMapper json;
 private final HttpClient http=HttpClient.newHttpClient();
 private final List<UUID> creados=new ArrayList<>();
 @BeforeEach void baseAislada(){assertTrue(env.getProperty("spring.datasource.url","").endsWith("/gestor_mvp_test"),"Requiere gestor_mvp_test; nunca ejecutar contra la base habitual");}
 @AfterEach void limpiar(){creados.forEach(usuarios::deleteById);creados.clear();}
 Usuario crear(Rol rol){Usuario u=new Usuario();u.setNombre("Prueba JWT");u.setEmail("jwt-"+UUID.randomUUID()+"@local.test");u.setUsername("jwt-"+UUID.randomUUID());u.setRol(rol);u.setActivo(true);u.setPasswordHash(encoder.encode("123456"));u=usuarios.saveAndFlush(u);creados.add(u.getId());return u;}
 HttpResponse<String> peticion(String path,String token,String body) throws Exception {
   var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+env.getProperty("local.server.port")+"/api"+path));
   if(token!=null)builder.header("Authorization","Bearer "+token);
   if(body!=null)builder.header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(body));
   return http.send(builder.build(),HttpResponse.BodyHandlers.ofString());
 }
 String login(Usuario u) throws Exception {
   var response=peticion("/auth/login",null,json.writeValueAsString(Map.of("username",u.getUsername(),"password","123456")));
   assertEquals(200,response.statusCode());String token=json.readTree(response.body()).get("token").asText();assertFalse(token.isBlank());return token;
 }
 @ParameterizedTest @EnumSource(value=Rol.class,names={"ADMINISTRADOR","VENDEDOR"})
 void tokenAnteriorSeRechazaTrasDesactivacion(Rol rol) throws Exception {
   Usuario administrador=crear(Rol.ADMINISTRADOR);String tokenAdmin=login(administrador);
   assertEquals(200,peticion("/usuarios",tokenAdmin,null).statusCode());
   Usuario usuario=crear(rol);String token=login(usuario);
   assertEquals(200,peticion("/productos",token,null).statusCode());
   assertEquals(rol==Rol.ADMINISTRADOR?200:403,peticion("/usuarios",token,null).statusCode());
   // No se añade un endpoint de administración: el cambio administrativo de estado
   // se aplica directamente en la base de pruebas, después de autenticar al administrador.
   usuario.setActivo(false);usuarios.saveAndFlush(usuario);
   assertEquals(401,peticion("/productos",token,null).statusCode());
   assertEquals(401,peticion("/usuarios",token,null).statusCode());
   assertEquals(401,peticion("/auth/login",null,json.writeValueAsString(Map.of("username",usuario.getUsername(),"password","123456"))).statusCode());
   assertEquals(200,peticion("/usuarios",tokenAdmin,null).statusCode());
 }
 @Test void jwtValidoSigueFuncionandoYRolSeObtieneDeLaBase() throws Exception {
   Usuario usuario=crear(Rol.ADMINISTRADOR);String token=login(usuario);
   assertEquals(200,peticion("/usuarios",token,null).statusCode());
   usuario.setRol(Rol.VENDEDOR);usuarios.saveAndFlush(usuario);
   assertEquals(200,peticion("/productos",token,null).statusCode());
   assertEquals(403,peticion("/usuarios",token,null).statusCode());
 }
 @Test void loginRequiereUsernameYRechazaCredencialesIncorrectas() throws Exception {
   Usuario u=crear(Rol.ADMINISTRADOR);
   assertEquals(401,peticion("/auth/login",null,json.writeValueAsString(Map.of("username","no-existe-"+UUID.randomUUID(),"password","123456"))).statusCode());
   assertEquals(401,peticion("/auth/login",null,json.writeValueAsString(Map.of("username",u.getUsername(),"password","incorrecta"))).statusCode());
   assertEquals(401,peticion("/auth/login",null,json.writeValueAsString(Map.of("username",u.getEmail(),"password","123456"))).statusCode());
   assertEquals(400,peticion("/auth/login",null,json.writeValueAsString(Map.of("email",u.getEmail(),"password","123456"))).statusCode());
   assertEquals(200,peticion("/auth/login",null,json.writeValueAsString(Map.of("username",u.getUsername().toUpperCase(Locale.ROOT),"password","123456"))).statusCode());
 }
 @Test void usernameDuplicadoEsRechazadoYRegistroNoEsPublico() throws Exception {
   Usuario admin=crear(Rol.ADMINISTRADOR);String token=login(admin);
   String datos=json.writeValueAsString(Map.of("nombre","Duplicado","username",admin.getUsername().toUpperCase(Locale.ROOT),"password","123456","rol","VENDEDOR"));
   long cantidad=usuarios.count();assertEquals(409,peticion("/auth/register",token,datos).statusCode());assertEquals(cantidad,usuarios.count());
   assertEquals(403,peticion("/auth/register",null,datos).statusCode());
   Usuario vendedor=crear(Rol.VENDEDOR);assertEquals(403,peticion("/auth/register",login(vendedor),datos).statusCode());
   assertTrue(usuarios.findByUsername(admin.getUsername()).isPresent());
 }
}
