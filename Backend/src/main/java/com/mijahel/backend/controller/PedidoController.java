package com.mijahel.backend.controller;
import com.mijahel.backend.dto.TiendaDTO.*;import com.mijahel.backend.service.PedidoService;import com.mijahel.backend.security.UsuarioDetails;import com.mijahel.backend.entity.Usuario;import org.springframework.web.bind.annotation.*;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.security.core.Authentication;import java.util.*;
@RestController @RequestMapping("/api") @PreAuthorize("hasAnyRole('ADMINISTRADOR','VENDEDOR','SUPERVISOR')")
public class PedidoController {
 private final PedidoService pedidos;public PedidoController(PedidoService p){pedidos=p;}
 private Usuario usuario(Authentication a){return ((UsuarioDetails)a.getPrincipal()).getUsuario();}
 @GetMapping("/pedidos-web") public List<PedidoVista> listar(@RequestParam(required=false) String estado){return pedidos.listar(estado);}
 @GetMapping("/pedidos-web/codigo") public PedidoInterno codigo(@RequestParam String codigo){return pedidos.codigo(codigo);}
 @GetMapping("/pedidos-web/{id}") public PedidoInterno detalle(@PathVariable UUID id){return pedidos.detalle(id);}
 @PostMapping("/pedidos-web/{id}/confirmar") @PreAuthorize("hasRole('ADMINISTRADOR')") public PedidoVista confirmar(@PathVariable UUID id,Authentication a){return pedidos.confirmar(id,usuario(a));}
 @PostMapping("/pedidos-web/{id}/listo") @PreAuthorize("hasRole('ADMINISTRADOR')") public PedidoVista listo(@PathVariable UUID id){return pedidos.listo(id);}
 @PostMapping("/pedidos-web/{id}/cancelar") @PreAuthorize("hasRole('ADMINISTRADOR')") public PedidoVista cancelar(@PathVariable UUID id,Authentication a){return pedidos.cancelar(id,usuario(a));}
 @PostMapping("/pedidos-web/{id}/entregar") public PedidoVista entregar(@PathVariable UUID id,Authentication a){return pedidos.entregar(id,usuario(a));}
 @GetMapping("/reportes/resumen") public Reporte reporte(@RequestParam(defaultValue="HOY") String periodo){return pedidos.reporte(periodo);}
}
