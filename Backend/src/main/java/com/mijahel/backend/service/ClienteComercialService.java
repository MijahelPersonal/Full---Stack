package com.mijahel.backend.service;
import com.mijahel.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;
@Service
public class ClienteComercialService {
 private final ClienteRepository clientes;private final VentaRepository ventas;private final ServicioRepository servicios;
 public ClienteComercialService(ClienteRepository c,VentaRepository v,ServicioRepository s){clientes=c;ventas=v;servicios=s;}
 public record Resultado(boolean eliminado,String mensaje){}
 @Transactional
 public Resultado eliminar(UUID id){
   var cliente=clientes.bloquear(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Cliente no encontrado"));
   if(ventas.existsByClienteId(id)||servicios.existsByClienteId(id)){
     cliente.setActivo(false);clientes.save(cliente);
     return new Resultado(false,"Cliente marcado como inactivo. Su historial se conserva.");
   }
   clientes.delete(cliente);clientes.flush();return new Resultado(true,"Cliente eliminado.");
 }
}
