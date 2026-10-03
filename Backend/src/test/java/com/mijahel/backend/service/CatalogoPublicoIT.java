package com.mijahel.backend.service;

import com.mijahel.backend.entity.Producto;
import com.mijahel.backend.repository.ProductoRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties="spring.jpa.show-sql=false")
class CatalogoPublicoIT {
 @Autowired ProductoRepository productos;
 @Autowired Environment env;
 @Autowired ObjectMapper json;
 final HttpClient http=HttpClient.newHttpClient();
 final List<UUID> ids=new ArrayList<>();
 Producto activo,inactivo;
 @BeforeEach void preparar(){
  assertTrue(env.getProperty("spring.datasource.url","").endsWith("/gestor_mvp_test"));
  activo=crear(true,"Catalogo QA "+UUID.randomUUID(),5,new BigDecimal("199.00"));
  activo.setDescripcion("Equipo de prueba");activo.setEspecificaciones(Map.of("Memoria","16 GB"));activo.setDestacado(true);activo.setPrecioAnterior(new BigDecimal("250.00"));productos.saveAndFlush(activo);
  inactivo=crear(false,"Privado QA "+UUID.randomUUID(),0,new BigDecimal("50.00"));
 }
 @AfterEach void limpiar(){ids.forEach(productos::deleteById);ids.clear();}
 Producto crear(boolean estado,String nombre,int stock,BigDecimal precio){Producto p=new Producto();p.setSku("QA-"+UUID.randomUUID());p.setNombre(nombre);p.setCategoria("CategoriaQA");p.setMarca("MarcaQA");p.setActivo(estado);p.setPrecioCompra(new BigDecimal("77"));p.setPrecioVenta(precio);p.setStock(stock);p.setStockMinimo(3);p=productos.saveAndFlush(p);ids.add(p.getId());return p;}
 HttpResponse<String> get(String path)throws Exception{return http.send(HttpRequest.newBuilder(URI.create("http://localhost:"+env.getProperty("local.server.port")+path)).build(),HttpResponse.BodyHandlers.ofString());}
 @Test void publicoExponeSoloCamposComercialesYExcluyeInactivos()throws Exception{
  var r=get("/api/public/productos?q=Catalogo%20QA");assertEquals(200,r.statusCode());assertEquals("no-store",r.headers().firstValue("Cache-Control").orElse(""));
  var item=json.readTree(r.body()).get("items").get(0);assertEquals(activo.getId().toString(),item.get("id").asText());
  Set<String> campos=new HashSet<>();item.properties().forEach(e->campos.add(e.getKey()));assertEquals(Set.of("id","slug","nombre","categoria","marca","precio","precioAnterior","stock","destacado","imagenUrl"),campos);
  var detalle=get("/api/public/productos/"+activo.getSlug());assertEquals(200,detalle.statusCode());assertTrue(detalle.body().contains("16 GB"));assertFalse(detalle.body().contains("precioCompra"));assertFalse(detalle.body().contains("stockMinimo"));
  assertEquals(404,get("/api/public/productos/"+inactivo.getSlug()).statusCode());
  assertEquals(0,json.readTree(get("/api/public/productos?q=Privado%20QA").body()).get("total").asLong());
 }
 @Test void filtrosOfertasFacetasYPaginacionSonReales()throws Exception{
  var r=get("/api/public/productos?categoria=CategoriaQA&marca=MarcaQA&min=190&max=210&disponibilidad=con-stock&oferta=true&tamano=1");assertEquals(200,r.statusCode());assertEquals(1,json.readTree(r.body()).get("items").size());assertTrue(get("/api/public/categorias").body().contains("CategoriaQA"));assertTrue(get("/api/public/marcas").body().contains("MarcaQA"));
  assertEquals(0,json.readTree(get("/api/public/productos?categoria=CategoriaQA&disponibilidad=sin-stock").body()).get("total").asLong());
  assertEquals(200,get("/api/public/productos/destacados").statusCode());assertEquals(200,get("/api/public/productos/ofertas").statusCode());
 }
 @Test void noPermiteEscriturasNiAccesoInternoYErroresNoFiltranDetalles()throws Exception{
  for(String path:List.of("/api/productos","/api/clientes","/api/inventario","/api/usuarios","/api/ventas"))assertEquals(403,get(path).statusCode(),path);
  var post=http.send(HttpRequest.newBuilder(URI.create("http://localhost:"+env.getProperty("local.server.port")+"/api/public/productos")).POST(HttpRequest.BodyPublishers.ofString("{}")).header("Content-Type","application/json").build(),HttpResponse.BodyHandlers.ofString());assertEquals(403,post.statusCode());
  for(String filtro:List.of("tamano=49","pagina=-1","min=200&max=100","orden=sql","pagina=abc")){var r=get("/api/public/productos?"+filtro);assertEquals(400,r.statusCode(),filtro);assertEquals("Filtros de catálogo inválidos",json.readTree(r.body()).get("error").asText());}
 }
 @Test void cambiosDelBackofficeSeReflejanSinReconstruirYSlugPermanece()throws Exception{
  String slug=activo.getSlug();activo.setPrecioVenta(new BigDecimal("189"));activo.setStock(0);activo.setNombre("Nombre actualizado");productos.saveAndFlush(activo);
  var d=json.readTree(get("/api/public/productos/"+slug).body());assertEquals(189,d.get("precio").asInt());assertEquals(0,d.get("stock").asInt());assertEquals("Nombre actualizado",d.get("nombre").asText());
 }
}
