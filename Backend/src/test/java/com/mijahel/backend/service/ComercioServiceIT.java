package com.mijahel.backend.service;
import com.mijahel.backend.dto.ComercioDTO.*;
import com.mijahel.backend.entity.*;
import com.mijahel.backend.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"spring.jpa.show-sql=false","app.productos.upload-dir=target/test-uploads/productos"})
class ComercioServiceIT {
 @Autowired ComercioService service;
 @Autowired ProductoRepository productos;
 @Autowired VentaRepository ventas;
 @Autowired DetalleVentaRepository detalles;
 @Autowired MovimientoInventarioRepository movimientos;
 @Autowired UsuarioRepository usuarios;
 @Autowired ClienteRepository clientes;
 @Autowired PasswordEncoder encoder;
 @Autowired Environment env;
 @Autowired PlatformTransactionManager manager;
 @Autowired ClienteComercialService clientesService;
 @Autowired ProductoImagenService imagenes;
 Usuario usuario;Cliente cliente;Producto producto;
 @BeforeEach void preparar(){
   assertTrue(env.getProperty("spring.datasource.url","").endsWith("/gestor_mvp_test"),"Esta prueba requiere la base aislada gestor_mvp_test");
   new TransactionTemplate(manager).execute(status->{
     movimientos.deleteAll();detalles.deleteAll();ventas.deleteAll();productos.deleteAll();
     usuario=usuarios.findByEmail("mvp.validation@local.test").orElseGet(()->{
       Usuario u=new Usuario();u.setUsername("validacion.mvp");u.setNombre("Validación MVP");u.setEmail("mvp.validation@local.test");u.setPasswordHash(encoder.encode("123456"));u.setRol(Rol.ADMINISTRADOR);return usuarios.save(u);
     });
     cliente=clientes.findAll().stream().findFirst().orElseGet(()->{Cliente c=new Cliente();c.setNombre("Cliente de validación");return clientes.save(c);});
     cliente.setActivo(true);clientes.save(cliente);
     return null;
   });
   producto=service.guardar(null,new ProductoRequest("MVP-TEST","Producto de validación","Periféricos","Prueba",new BigDecimal("50.00"),new BigDecimal("89.00"),5,2,true),usuario);
 }
 VentaRequest solicitud(int cantidad){return new VentaRequest(UUID.randomUUID(),cliente.getId(),List.of(new LineaRequest(producto.getId(),cantidad)));}
 ProductoRequest datos(){return new ProductoRequest("MVP-TEST","Producto de validación","Periféricos","Prueba",new BigDecimal("50.00"),new BigDecimal("89.00"),0,2,true);}
 org.springframework.mock.web.MockMultipartFile imagen(String formato) throws Exception {
   var out=new java.io.ByteArrayOutputStream();javax.imageio.ImageIO.write(new java.awt.image.BufferedImage(16,16,java.awt.image.BufferedImage.TYPE_INT_RGB),formato,out);
   return new org.springframework.mock.web.MockMultipartFile("imagen","foto."+formato,"image/"+(formato.equals("jpg")?"jpeg":formato),out.toByteArray());
 }
 @Test void imagenOpcionalReemplazoYEliminacion() throws Exception {
   assertNull(producto.getImagenUrl());
   String inicial=service.guardarConImagen(producto.getId(),datos(),imagen("png"),false,usuario).getImagenUrl();
   assertTrue(imagenes.leer(inicial.substring(inicial.lastIndexOf('/')+1)).exists());
   assertEquals(inicial,service.guardar(producto.getId(),datos(),usuario).getImagenUrl());
   String nueva=service.guardarConImagen(producto.getId(),datos(),imagen("jpg"),false,usuario).getImagenUrl();
   assertNotEquals(inicial,nueva);
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->imagenes.leer(inicial.substring(inicial.lastIndexOf('/')+1)));
   assertNull(service.guardarConImagen(producto.getId(),datos(),null,true,usuario).getImagenUrl());
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->imagenes.leer(nueva.substring(nueva.lastIndexOf('/')+1)));
 }
 @Test void imagenInvalidaNoModificaProducto(){
   var archivo=new org.springframework.mock.web.MockMultipartFile("imagen","falso.png","image/png","contenido falso".getBytes());
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->service.guardarConImagen(producto.getId(),datos(),archivo,false,usuario));
   assertNull(productos.findById(producto.getId()).orElseThrow().getImagenUrl());assertEquals(5,productos.findById(producto.getId()).orElseThrow().getStock());
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->imagenes.guardar(new org.springframework.mock.web.MockMultipartFile("imagen","grande.jpg","image/jpeg",new byte[2*1024*1024+1])));
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->imagenes.leer("../../application.properties"));
 }
 @Test void rollbackLimpiaImagenNueva() throws Exception {
   var archivo=imagen("png");String[] url=new String[1];
   assertThrows(IllegalStateException.class,()->new TransactionTemplate(manager).execute(status->{url[0]=service.guardarConImagen(producto.getId(),datos(),archivo,false,usuario).getImagenUrl();throw new IllegalStateException("Rollback");}));
   assertNull(productos.findById(producto.getId()).orElseThrow().getImagenUrl());
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->imagenes.leer(url[0].substring(url[0].lastIndexOf('/')+1)));
 }
 @Test void rollbackDelReemplazoConservaArchivoAnterior() throws Exception {
   String anterior=service.guardarConImagen(producto.getId(),datos(),imagen("png"),false,usuario).getImagenUrl();
   var archivo=imagen("jpg");String[] nueva=new String[1];
   assertThrows(IllegalStateException.class,()->new TransactionTemplate(manager).execute(status->{nueva[0]=service.guardarConImagen(producto.getId(),datos(),archivo,false,usuario).getImagenUrl();throw new IllegalStateException("Rollback");}));
   assertEquals(anterior,productos.findById(producto.getId()).orElseThrow().getImagenUrl());assertTrue(imagenes.leer(anterior.substring(anterior.lastIndexOf('/')+1)).exists());
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->imagenes.leer(nueva[0].substring(nueva[0].lastIndexOf('/')+1)));
   service.guardarConImagen(producto.getId(),datos(),null,true,usuario);
 }
 @Test void webpSinFrameValidoYArchivoVacioSeRechazan(){
   byte[] falso=new byte[30];System.arraycopy("RIFF".getBytes(),0,falso,0,4);falso[4]=22;System.arraycopy("WEBPVP8X".getBytes(),0,falso,8,8);falso[16]=10;
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->imagenes.guardar(new org.springframework.mock.web.MockMultipartFile("imagen","falso.webp","image/webp",falso)));
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->service.guardarConImagen(producto.getId(),datos(),new org.springframework.mock.web.MockMultipartFile("imagen","vacio.png","image/png",new byte[0]),false,usuario));
 }
 @Test void clienteSinVentasSeEliminaFisicamente(){
   Cliente libre=new Cliente();libre.setNombre("Sin ventas");clientes.save(libre);
   assertTrue(clientesService.eliminar(libre.getId()).eliminado());assertFalse(clientes.existsById(libre.getId()));
 }
 @Test void clienteConVentasSeDesactivaYConservaHistorial(){
   var venta=service.vender(solicitud(1),usuario);
   assertFalse(clientesService.eliminar(cliente.getId()).eliminado());assertFalse(clientes.findById(cliente.getId()).orElseThrow().isActivo());
   assertTrue(ventas.existsById(venta.venta().getId()));assertEquals(1,detalles.findByVentaId(venta.venta().getId()).size());assertEquals(2,movimientos.count());
   assertTrue(clientes.findByActivoTrue().stream().noneMatch(c->c.getId().equals(cliente.getId())));
   assertThrows(IllegalStateException.class,()->service.vender(solicitud(1),usuario));assertEquals(1,ventas.count());
 }
 @Test void ventaCompletaYReintento(){
   VentaRequest r=solicitud(2);VentaDetalle v=service.vender(r,usuario);
   assertEquals(new BigDecimal("178.00"),v.venta().getTotal());
   assertEquals(1,v.detalles().size());assertEquals(2,v.detalles().get(0).getCantidad());
   assertEquals(3,productos.findById(producto.getId()).orElseThrow().getStock());
   assertEquals(2,movimientos.count());assertEquals("COMPLETADA",v.venta().getEstado());
   assertEquals(v.venta().getId(),service.vender(r,usuario).venta().getId());assertEquals(1,ventas.count());assertEquals(3,productos.findById(producto.getId()).orElseThrow().getStock());
 }
 @Test void stockInsuficienteNoEscribe(){
   assertThrows(IllegalStateException.class,()->service.vender(solicitud(6),usuario));
   assertEquals(0,ventas.count());assertEquals(0,detalles.count());assertEquals(1,movimientos.count());assertEquals(5,productos.findById(producto.getId()).orElseThrow().getStock());
 }
 @Test void referenciaNoPermiteCambiarLaVenta(){
   VentaRequest r=solicitud(1);service.vender(r,usuario);
   assertThrows(IllegalStateException.class,()->service.vender(new VentaRequest(r.clave(),cliente.getId(),List.of(new LineaRequest(producto.getId(),2))),usuario));
   assertEquals(1,ventas.count());assertEquals(4,productos.findById(producto.getId()).orElseThrow().getStock());
 }
 @Test void admiteVendedorSinModificarRolesAntiguos(){
   Usuario vendedor=new Usuario();vendedor.setUsername("vendedor-"+UUID.randomUUID());vendedor.setNombre("Vendedor prueba");vendedor.setEmail(UUID.randomUUID()+"@local.test");vendedor.setRol(Rol.VENDEDOR);vendedor.setPasswordHash(encoder.encode("123456"));usuarios.save(vendedor);
   VentaDetalle v=service.vender(solicitud(1),vendedor);assertEquals(vendedor.getId(),v.venta().getVendedorId());
 }
 @Test void rollbackDespuesDeGuardarVenta(){
   assertThrows(RuntimeException.class,()->new TransactionTemplate(manager).execute(status->{service.vender(solicitud(1),usuario);throw new IllegalStateException("Reversión de prueba");}));
   assertEquals(0,ventas.count());assertEquals(0,detalles.count());assertEquals(1,movimientos.count());assertEquals(5,productos.findById(producto.getId()).orElseThrow().getStock());
 }
 @Test void ventaConcurrenteNoSobrevende() throws Exception {
   ExecutorService pool=Executors.newFixedThreadPool(2);CountDownLatch inicio=new CountDownLatch(1);
   try{
     Callable<Boolean> tarea=()->{inicio.await();try{service.vender(solicitud(4),usuario);return true;}catch(IllegalStateException e){return false;}};
     Future<Boolean> a=pool.submit(tarea),b=pool.submit(tarea);inicio.countDown();
     assertNotEquals(a.get(10,TimeUnit.SECONDS),b.get(10,TimeUnit.SECONDS));
     assertEquals(1,ventas.count());assertEquals(1,productos.findById(producto.getId()).orElseThrow().getStock());assertEquals(2,movimientos.count());
   }finally{pool.shutdownNow();}
 }
 @Test void precioHistoricoYMovimientoManual(){
   VentaDetalle v=service.vender(solicitud(1),usuario);
   service.guardar(producto.getId(),new ProductoRequest("MVP-TEST","Nombre nuevo","Periféricos","Prueba",new BigDecimal("50.00"),new BigDecimal("100.00"),0,2,true),usuario);
   assertEquals(new BigDecimal("89.00"),detalles.findByVentaId(v.venta().getId()).get(0).getPrecioUnitario());
   assertEquals("Producto de validación",detalles.findByVentaId(v.venta().getId()).get(0).getNombre());
   service.movimiento(new MovimientoRequest(producto.getId(),"ENTRADA",2,"Reposición de prueba"),usuario);
   assertEquals(6,productos.findById(producto.getId()).orElseThrow().getStock());
 }
}
