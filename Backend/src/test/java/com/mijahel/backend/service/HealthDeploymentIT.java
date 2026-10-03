package com.mijahel.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import java.net.URI;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,
 properties={"app.cors.allowed-origins=https://struch.example,app://gestion","app.web.allowed-origins=https://struch.example"})
class HealthDeploymentIT {
 @LocalServerPort int port;
 HttpResponse<String> get(String path) throws Exception {
  return HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+path)).GET().build(),HttpResponse.BodyHandlers.ofString());
 }
 @Test void healthPublicoSinDetalles() throws Exception {
  var r=get("/api/health");assertEquals(200,r.statusCode());assertEquals("{\"status\":\"UP\"}",r.body());
 }
 @Test void apiInternaSigueProtegida() throws Exception {assertTrue(get("/api/productos").statusCode()>=400);}
 @Test void corsOrigenesExplicitos() throws Exception {
  for(String origin:java.util.List.of("https://struch.example","app://gestion","https://externo.example")) {
   var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/tienda/auth/login")).header("Origin",origin).header("Access-Control-Request-Method","POST").header("Access-Control-Request-Headers","content-type").method("OPTIONS",HttpRequest.BodyPublishers.noBody()).build();
   var r=HttpClient.newHttpClient().send(request,HttpResponse.BodyHandlers.ofString());
   if(origin.contains("externo"))assertEquals(403,r.statusCode());else{assertEquals(200,r.statusCode());assertEquals(origin,r.headers().firstValue("Access-Control-Allow-Origin").orElse(""));}
  }
 }
}
