package com.mijahel.backend.controller;
import com.mijahel.backend.dto.TiendaDTO.*;import com.mijahel.backend.service.*;import org.springframework.web.bind.annotation.*;import org.springframework.security.core.Authentication;import jakarta.validation.Valid;import java.util.*;
@RestController @RequestMapping("/api/tienda")
public class TiendaController {
 private final CuentaClienteService cuentas;private final PedidoService pedidos;
 public TiendaController(CuentaClienteService c,PedidoService p){cuentas=c;pedidos=p;}
 private UUID id(Authentication a){return (UUID)a.getPrincipal();}
 @PostMapping("/auth/registro") public Sesion registro(@Valid @RequestBody Registro r){return cuentas.registrar(r);}
 @PostMapping("/auth/login") public Sesion login(@Valid @RequestBody Login r){return cuentas.login(r);}
 @GetMapping("/cuenta") public Cuenta cuenta(Authentication a){return cuentas.vista(cuentas.activa(id(a)));}
 @GetMapping("/pedidos") public List<PedidoVista> pedidos(Authentication a){return pedidos.propios(id(a));}
 @GetMapping("/pedidos/{id}") public PedidoVista pedido(@PathVariable UUID id,Authentication a){return pedidos.propio(id(a),id);}
 @PostMapping("/pedidos") public PedidoVista crear(@Valid @RequestBody CrearPedido r,Authentication a){return pedidos.crear(id(a),r);}
}
