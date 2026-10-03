package com.mijahel.backend.service;

import com.mijahel.backend.dto.TiendaDTO.*;
import com.mijahel.backend.entity.*;
import com.mijahel.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.time.*;
import java.math.BigDecimal;
import java.security.SecureRandom;

@Service @Transactional
public class PedidoService {
 private final PedidoRepository pedidos;private final DetallePedidoRepository detalles;private final CuentaClienteRepository cuentas;private final ClienteRepository clientes;private final ProductoRepository productos;private final VentaRepository ventas;private final DetalleVentaRepository detalleVentas;private final MovimientoInventarioRepository movimientos;private final CuentaClienteService cuentaService;
 private final SecureRandom random=new SecureRandom();
 public PedidoService(PedidoRepository p,DetallePedidoRepository d,CuentaClienteRepository a,ClienteRepository c,ProductoRepository pr,VentaRepository v,DetalleVentaRepository dv,MovimientoInventarioRepository m,CuentaClienteService cs){pedidos=p;detalles=d;cuentas=a;clientes=c;productos=pr;ventas=v;detalleVentas=dv;movimientos=m;cuentaService=cs;}
 private LocalDateTime ahora(){return LocalDateTime.now(ZoneId.of("America/Lima"));}
 private ResponseStatusException error(String mensaje){return new ResponseStatusException(HttpStatus.CONFLICT,mensaje);}
 private Pedido bloquear(UUID id){return pedidos.bloquear(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Pedido no encontrado"));}
 public PedidoVista vista(Pedido p){return new PedidoVista(p.getId(),p.getNumeroPedido(),p.getCodigoRecojo(),p.getClienteNombre(),p.getFechaCreacion(),p.getFechaConfirmacion(),p.getFechaListo(),p.getFechaEntrega(),p.getEstado(),p.getTotal(),"RECOJO EN TIENDA",p.getVentaId(),detalles.findByPedidoId(p.getId()).stream().map(d->new Linea(d.getProductoId(),d.getSkuHistorico(),d.getNombreHistorico(),d.getCantidad(),d.getPrecioUnitario(),d.getSubtotal())).toList());}
 public PedidoVista crear(UUID cuentaId,CrearPedido r){
  // Serializa reintentos simultáneos de la misma cuenta antes de buscar la clave.
  cuentas.bloquear(cuentaId).orElseThrow(()->error("Cuenta no encontrada"));var cuenta=cuentaService.activa(cuentaId);
  Cliente cliente=clientes.bloquear(cuenta.getClienteId()).orElseThrow();if(!cliente.isActivo())throw error("Cliente inactivo");
  Map<UUID,Integer> lineas=new TreeMap<>();for(var l:r.lineas()){if(l.cantidad()<1||lineas.putIfAbsent(l.productoId(),l.cantidad())!=null)throw error("Cantidad inválida o producto duplicado");}
  var anterior=pedidos.findByCuentaIdAndClave(cuentaId,r.clave());if(anterior.isPresent()){
   var ds=detalles.findByPedidoId(anterior.get().getId());if(ds.size()!=lineas.size()||ds.stream().anyMatch(d->!Objects.equals(lineas.get(d.getProductoId()),d.getCantidad())))throw error("La referencia corresponde a otro pedido");return vista(anterior.get());
  }
  if(lineas.isEmpty()||lineas.size()>30)throw error("Selecciona entre 1 y 30 productos");
  List<DetallePedido> ds=new ArrayList<>();BigDecimal total=BigDecimal.ZERO;
  for(var l:lineas.entrySet()){
   Producto pr=productos.bloquear(l.getKey()).orElseThrow(()->error("Producto no disponible"));if(!pr.getActivo()||pr.getStock()<l.getValue())throw error("Stock insuficiente: "+pr.getNombre());
   DetallePedido d=new DetallePedido();d.setProductoId(pr.getId());d.setSkuHistorico(pr.getSku());d.setNombreHistorico(pr.getNombre());d.setCantidad(l.getValue());d.setPrecioUnitario(pr.getPrecioVenta());d.setSubtotal(pr.getPrecioVenta().multiply(BigDecimal.valueOf(l.getValue())));ds.add(d);total=total.add(d.getSubtotal());
  }
  if(total.precision()-total.scale()>12)throw error("Importe del pedido fuera de límite");
  String codigo;do{StringBuilder parte=new StringBuilder();String alfabeto="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";for(int i=0;i<10;i++)parte.append(alfabeto.charAt(random.nextInt(alfabeto.length())));codigo="STR-"+ahora().toLocalDate().toString().replace("-","")+"-"+parte;}while(pedidos.existsByCodigoRecojo(codigo));
  Pedido p=new Pedido();p.setCuentaId(cuentaId);p.setClienteId(cliente.getId());p.setClienteNombre(cliente.getNombre());p.setClave(r.clave());p.setCodigoRecojo(codigo);p.setNumeroPedido("PED-"+UUID.randomUUID().toString().toUpperCase());p.setEstado("PENDIENTE");p.setTotal(total);p.setFechaCreacion(ahora());pedidos.saveAndFlush(p);
  for(var d:ds){d.setPedidoId(p.getId());detalles.save(d);}return vista(p);
 }
 @Transactional(readOnly=true) public List<PedidoVista> propios(UUID cuenta){return pedidos.findByCuentaIdOrderByFechaCreacionDesc(cuenta).stream().map(this::vista).toList();}
 @Transactional(readOnly=true) public PedidoVista propio(UUID cuenta,UUID id){return vista(pedidos.findByIdAndCuentaId(id,cuenta).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Pedido no encontrado")));}
 @Transactional(readOnly=true) public List<PedidoVista> listar(String estado){return pedidos.findAllByOrderByFechaCreacionDesc().stream().filter(p->estado==null||estado.isBlank()||estado.equals(p.getEstado())).map(this::vista).toList();}
 @Transactional(readOnly=true) public PedidoInterno detalle(UUID id){Pedido p=pedidos.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Pedido no encontrado"));Map<UUID,Integer> stock=new HashMap<>();for(var d:detalles.findByPedidoId(id))stock.put(d.getProductoId(),productos.findById(d.getProductoId()).orElseThrow().getStock());return new PedidoInterno(vista(p),stock);}
 @Transactional(readOnly=true) public PedidoInterno codigo(String codigo){return detalle(pedidos.findByCodigoRecojo(codigo.trim().toUpperCase(Locale.ROOT)).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Código de recojo inexistente")).getId());}
 private List<DetallePedido> ordenados(UUID id){return detalles.findByPedidoId(id).stream().sorted(Comparator.comparing(DetallePedido::getProductoId)).toList();}
 private void mover(Producto pr,DetallePedido d,Pedido p,Usuario u,boolean entrada){
  int anterior=pr.getStock();long posterior=(long)anterior+(entrada?d.getCantidad():-d.getCantidad());if(posterior<0||posterior>Integer.MAX_VALUE)throw error("Stock inválido: "+pr.getNombre());pr.setStock((int)posterior);productos.save(pr);
  MovimientoInventario m=new MovimientoInventario();m.setProductoId(pr.getId());m.setProductoNombre(pr.getNombre());m.setTipo(entrada?"ENTRADA":"SALIDA");m.setCantidad(d.getCantidad());m.setStockAnterior(anterior);m.setStockPosterior((int)posterior);m.setPedidoId(p.getId());m.setMotivo((entrada?"Liberación de reserva ":"Reserva de pedido ")+p.getCodigoRecojo());m.setResponsable(u.getNombre());m.setFecha(ahora());movimientos.save(m);
 }
 public PedidoVista confirmar(UUID id,Usuario u){Pedido p=bloquear(id);if(!p.getEstado().equals("PENDIENTE"))throw error("Solo se puede confirmar un pedido pendiente");
  for(var d:ordenados(id)){Producto pr=productos.bloquear(d.getProductoId()).orElseThrow();if(!pr.getActivo()||pr.getStock()<d.getCantidad())throw error("Stock insuficiente: "+pr.getNombre());mover(pr,d,p,u,false);}p.setEstado("CONFIRMADO");p.setFechaConfirmacion(ahora());return vista(p);
 }
 public PedidoVista listo(UUID id){Pedido p=bloquear(id);if(!p.getEstado().equals("CONFIRMADO"))throw error("Primero confirma el pedido");p.setEstado("LISTO_PARA_RECOGER");p.setFechaListo(ahora());return vista(p);}
 public PedidoVista cancelar(UUID id,Usuario u){Pedido p=bloquear(id);if(Set.of("ENTREGADO","CANCELADO").contains(p.getEstado()))throw error("El pedido ya fue entregado o cancelado");if(!p.getEstado().equals("PENDIENTE"))for(var d:ordenados(id))mover(productos.bloquear(d.getProductoId()).orElseThrow(),d,p,u,true);p.setEstado("CANCELADO");return vista(p);}
 public PedidoVista entregar(UUID id,Usuario u){Pedido p=bloquear(id);if(!p.getEstado().equals("LISTO_PARA_RECOGER")||p.getVentaId()!=null)throw error("El pedido no está listo o ya fue entregado");
  Venta v=new Venta();v.setClave(p.getId());v.setNumero("V-WEB-"+p.getCodigoRecojo());v.setClienteId(p.getClienteId());v.setClienteNombre(p.getClienteNombre());v.setVendedorId(u.getId());v.setVendedorNombre(u.getNombre());v.setTotal(p.getTotal());v.setEstado("COMPLETADA");v.setOrigen("WEB");v.setFecha(ahora());ventas.saveAndFlush(v);
  for(var d:ordenados(id)){DetalleVenta dv=new DetalleVenta();dv.setVentaId(v.getId());dv.setProductoId(d.getProductoId());dv.setSku(d.getSkuHistorico());dv.setNombre(d.getNombreHistorico());dv.setCantidad(d.getCantidad());dv.setPrecioUnitario(d.getPrecioUnitario());dv.setSubtotal(d.getSubtotal());detalleVentas.save(dv);}
  p.setVentaId(v.getId());p.setEstado("ENTREGADO");p.setFechaEntrega(ahora());return vista(p);
 }
 @Transactional(readOnly=true) public Reporte reporte(String periodo){LocalDate hoy=ahora().toLocalDate();LocalDate desde=switch(periodo){case "HOY"->hoy;case "7DIAS"->hoy.minusDays(6);case "MES"->hoy.withDayOfMonth(1);default->throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Período inválido");};
  var vs=ventas.findAllByOrderByFechaDesc().stream().filter(v->v.getEstado().equals("COMPLETADA")&&!v.getFecha().toLocalDate().isBefore(desde)&&!v.getFecha().toLocalDate().isAfter(hoy)).toList();var web=vs.stream().filter(v->"WEB".equals(v.getOrigen())).toList();var pos=vs.stream().filter(v->"POS".equals(v.getOrigen())).toList();Map<UUID,ProductoVendido> top=new HashMap<>();for(var v:vs)for(var d:detalleVentas.findByVentaId(v.getId()))top.compute(d.getProductoId(),(id,t)->new ProductoVendido(d.getNombre(),d.getCantidad()+(t==null?0:t.cantidad()),d.getSubtotal().add(t==null?BigDecimal.ZERO:t.importe())));
  var ps=pedidos.findAllByOrderByFechaCreacionDesc();return new Reporte(periodo,vs.size(),suma(vs),web.size(),pos.size(),suma(web),suma(pos),ps.stream().filter(p->"PENDIENTE".equals(p.getEstado())).count(),ps.stream().filter(p->"ENTREGADO".equals(p.getEstado())&&p.getFechaEntrega()!=null&&!p.getFechaEntrega().toLocalDate().isBefore(desde)&&!p.getFechaEntrega().toLocalDate().isAfter(hoy)).count(),top.values().stream().sorted(Comparator.comparingLong(ProductoVendido::cantidad).reversed()).limit(10).toList(),productos.findAllByOrderByNombreAsc().stream().filter(p->p.getActivo()&&p.getStock()<=p.getStockMinimo()).toList());
 }
 private BigDecimal suma(List<Venta> vs){return vs.stream().map(Venta::getTotal).reduce(BigDecimal.ZERO,BigDecimal::add);}
}
