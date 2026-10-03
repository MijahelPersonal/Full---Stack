package com.mijahel.backend.controller;
import com.mijahel.backend.dto.ComercioDTO.*;
import com.mijahel.backend.entity.*;
import com.mijahel.backend.repository.*;
import com.mijahel.backend.service.ComercioService;
import com.mijahel.backend.security.UsuarioDetails;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR','VENDEDOR')")
public class ComercioController {
 private final ComercioService service; private final ProductoRepository productos;
 private final VentaRepository ventas;private final DetalleVentaRepository detalles;private final MovimientoInventarioRepository movimientos;
 public ComercioController(ComercioService s,ProductoRepository p,VentaRepository v,DetalleVentaRepository d,MovimientoInventarioRepository m){service=s;productos=p;ventas=v;detalles=d;movimientos=m;}
 private Usuario usuario(Authentication a){return ((UsuarioDetails)a.getPrincipal()).getUsuario();}
 @GetMapping("/productos") public List<Producto> productos(){return productos.findAllByOrderByNombreAsc();}
 @PostMapping(value="/productos",consumes="application/json") @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
 public Producto crear(@Valid @RequestBody ProductoRequest r,Authentication a){return service.guardar(null,r,usuario(a));}
 @PutMapping(value="/productos/{id}",consumes="application/json") @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
 public Producto editar(@PathVariable UUID id,@Valid @RequestBody ProductoRequest r,Authentication a){return service.guardar(id,r,usuario(a));}
 @PostMapping(value="/productos",consumes="multipart/form-data") @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
 public Producto crearImagen(@Valid @RequestPart("producto") ProductoRequest r,@RequestPart(value="imagen",required=false) org.springframework.web.multipart.MultipartFile imagen,Authentication a){return service.guardarConImagen(null,r,imagen,false,usuario(a));}
 @PutMapping(value="/productos/{id}",consumes="multipart/form-data") @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
 public Producto editarImagen(@PathVariable UUID id,@Valid @RequestPart("producto") ProductoRequest r,@RequestPart(value="imagen",required=false) org.springframework.web.multipart.MultipartFile imagen,@RequestParam(defaultValue="false") boolean eliminarImagen,Authentication a){return service.guardarConImagen(id,r,imagen,eliminarImagen,usuario(a));}
 @GetMapping("/inventario") public List<Producto> inventario(){return productos();}
 @GetMapping("/inventario/movimientos") public List<MovimientoInventario> movimientos(){return movimientos.findAllByOrderByFechaDesc();}
 @PostMapping("/inventario/movimientos") @PreAuthorize("hasAnyRole('ADMINISTRADOR','SUPERVISOR')")
 public Producto movimiento(@Valid @RequestBody MovimientoRequest r,Authentication a){return service.movimiento(r,usuario(a));}
 @GetMapping("/ventas") public List<Venta> ventas(){return ventas.findAllByOrderByFechaDesc();}
 @GetMapping("/ventas/{id}") public VentaDetalle detalle(@PathVariable UUID id){
   Venta v=ventas.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Venta no encontrada"));
   return new VentaDetalle(v,detalles.findByVentaId(id));
 }
 @PostMapping("/ventas") public VentaDetalle vender(@Valid @RequestBody VentaRequest r,Authentication a){return service.vender(r,usuario(a));}
 @GetMapping("/inicio/resumen") public Inicio inicio(){return service.inicio();}
}
