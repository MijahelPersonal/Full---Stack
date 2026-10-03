package com.mijahel.backend.service;
import com.mijahel.backend.dto.ComercioDTO.*;
import com.mijahel.backend.entity.*;
import com.mijahel.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class ComercioService {
 private final ProductoRepository productos;
 private final VentaRepository ventas;
 private final DetalleVentaRepository detalles;
 private final MovimientoInventarioRepository movimientos;
 private final ClienteRepository clientes;
 private final ProductoImagenService imagenes;
 public ComercioService(ProductoRepository p, VentaRepository v, DetalleVentaRepository d,
   MovimientoInventarioRepository m, ClienteRepository c,ProductoImagenService i){productos=p;ventas=v;detalles=d;movimientos=m;clientes=c;imagenes=i;}
 public Producto guardarConImagen(UUID id,ProductoRequest r,org.springframework.web.multipart.MultipartFile archivo,boolean eliminar,Usuario usuario){
   Producto p=guardar(id,r,usuario);
   if(archivo!=null){
     String anterior=p.getImagenUrl();p.setImagenUrl(imagenes.guardar(archivo));imagenes.eliminarAnteriorAlConfirmar(anterior);
   }else if(eliminar){String anterior=p.getImagenUrl();p.setImagenUrl(null);imagenes.eliminarAnteriorAlConfirmar(anterior);}
   return productos.save(p);
 }
 private Producto bloquear(UUID id){return productos.bloquear(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Producto no encontrado"));}
 public Producto guardar(UUID id, ProductoRequest r, Usuario usuario){
   Producto p=id==null?new Producto():bloquear(id);
   if(id!=null && r.stockInicial()!=0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"El stock se modifica desde Inventario");
   p.setSku(r.sku().trim());p.setNombre(r.nombre().trim());p.setCategoria(r.categoria().trim());p.setMarca(r.marca().trim());
   p.setPrecioCompra(r.precioCompra());p.setPrecioVenta(r.precioVenta());p.setStockMinimo(r.stockMinimo());p.setActivo(r.activo());
   if(r.web()!=null){
     if(r.web().precioAnterior()!=null && r.web().precioAnterior().compareTo(r.precioVenta())<=0)
       throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"El precio anterior debe ser mayor al precio de venta");
     p.setDescripcion(r.web().descripcion().trim());p.setEspecificaciones(r.web().especificaciones());
     p.setDestacado(r.web().destacado());p.setPrecioAnterior(r.web().precioAnterior());
   }
   productos.saveAndFlush(p);
   if(id==null && r.stockInicial()>0) mover(p,"ENTRADA",r.stockInicial(),"Stock inicial",null,usuario);
   return p;
 }
 private void mover(Producto p,String tipo,int cantidad,String motivo,UUID ventaId,Usuario usuario){
   int anterior=p.getStock();
   long posterior=(long) anterior+("ENTRADA".equals(tipo)?cantidad:-cantidad);
   if(cantidad<=0 || posterior<0 || posterior>Integer.MAX_VALUE) throw new IllegalStateException("Stock insuficiente o cantidad inválida para "+p.getNombre());
   p.setStock((int)posterior);productos.save(p);
   MovimientoInventario m=new MovimientoInventario();
   m.setProductoId(p.getId());m.setProductoNombre(p.getNombre());m.setTipo(tipo);m.setCantidad(cantidad);
   m.setStockAnterior(anterior);m.setStockPosterior(p.getStock());m.setMotivo(motivo);m.setVentaId(ventaId);
   m.setResponsable(usuario.getNombre());m.setFecha(LocalDateTime.now());movimientos.save(m);
 }
 public Producto movimiento(MovimientoRequest r,Usuario usuario){
   if(!Set.of("ENTRADA","SALIDA").contains(r.tipo())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Tipo de movimiento inválido");
   Producto p=bloquear(r.productoId());mover(p,r.tipo(),r.cantidad(),r.motivo(),null,usuario);return p;
 }
 public VentaDetalle vender(VentaRequest r,Usuario usuario){
   Optional<Venta> existente=ventas.findByClave(r.clave());
   if(existente.isPresent()){
     Venta v=existente.get();
     if(!v.getVendedorId().equals(usuario.getId())) throw new IllegalStateException("La referencia ya está utilizada");
     List<DetalleVenta> lineas=detalles.findByVentaId(v.getId());
     boolean coincide=Objects.equals(v.getClienteId(),r.clienteId()) && lineas.size()==r.lineas().size()
       && lineas.stream().allMatch(d->r.lineas().stream().anyMatch(l->l.productoId().equals(d.getProductoId())&&l.cantidad()==d.getCantidad()));
     if(!coincide) throw new IllegalStateException("La referencia corresponde a otra venta; conserva el borrador original o inicia una nueva venta");
     return new VentaDetalle(v,lineas);
   }
   Cliente c=r.clienteId()==null?null:clientes.bloquear(r.clienteId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Cliente no encontrado"));
   if(c!=null&&!c.isActivo()) throw new IllegalStateException("El cliente está inactivo");
   Map<UUID,Integer> cantidades=new TreeMap<>();
   for(LineaRequest l:r.lineas()){
     if(cantidades.containsKey(l.productoId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Producto duplicado");
     cantidades.put(l.productoId(),l.cantidad());
   }
   List<Producto> seleccion=new ArrayList<>();
   BigDecimal total=BigDecimal.ZERO;
   for(var entry:cantidades.entrySet()){
     Producto p=bloquear(entry.getKey());
     if(!p.getActivo() || p.getStock()<entry.getValue()) throw new IllegalStateException("Stock insuficiente o producto inactivo: "+p.getNombre());
     seleccion.add(p);total=total.add(p.getPrecioVenta().multiply(BigDecimal.valueOf(entry.getValue())));
   }
   Venta v=new Venta();v.setClave(r.clave());v.setNumero("V-"+r.clave().toString().toUpperCase());
   v.setClienteId(c==null?null:c.getId());v.setClienteNombre(c==null?"Público general":c.getNombre());v.setOrigen("POS");v.setVendedorId(usuario.getId());v.setVendedorNombre(usuario.getNombre());
   v.setTotal(total);v.setEstado("COMPLETADA");v.setFecha(LocalDateTime.now());ventas.saveAndFlush(v);
   List<DetalleVenta> resultado=new ArrayList<>();
   for(Producto p:seleccion){
     int cantidad=cantidades.get(p.getId());DetalleVenta d=new DetalleVenta();
     d.setVentaId(v.getId());d.setProductoId(p.getId());d.setSku(p.getSku());d.setNombre(p.getNombre());
     d.setCantidad(cantidad);d.setPrecioUnitario(p.getPrecioVenta());d.setSubtotal(p.getPrecioVenta().multiply(BigDecimal.valueOf(cantidad)));
     resultado.add(detalles.save(d));mover(p,"SALIDA",cantidad,"Venta "+v.getNumero(),v.getId(),usuario);
   }
   return new VentaDetalle(v,resultado);
 }
 @Transactional(readOnly=true)
 public Inicio inicio(){
   List<Venta> vs=ventas.findAllByOrderByFechaDesc();List<Producto> ps=productos.findAllByOrderByNombreAsc().stream().filter(Producto::getActivo).toList();
   LocalDate hoy=LocalDate.now(ZoneId.of("America/Lima"));
   List<Venta> hoyVentas=vs.stream().filter(v->v.getFecha().toLocalDate().equals(hoy)).toList();
   List<Producto> bajos=ps.stream().filter(p->p.getStock()<=p.getStockMinimo()).sorted(Comparator.comparingInt(Producto::getStock)).toList();
   return new Inicio(hoyVentas.size(),hoyVentas.stream().map(Venta::getTotal).reduce(BigDecimal.ZERO,BigDecimal::add),ps.size(),bajos.size(),vs.stream().limit(8).toList(),bajos.stream().limit(8).toList());
 }
}
