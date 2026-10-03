package com.mijahel.backend.controller;

import com.mijahel.backend.entity.Cliente;
import com.mijahel.backend.repository.ClienteRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteRepository clienteRepository;
    private final com.mijahel.backend.service.ClienteComercialService service;

    public ClienteController(ClienteRepository clienteRepository,com.mijahel.backend.service.ClienteComercialService service){
        this.clienteRepository = clienteRepository;
        this.service=service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR', 'VENDEDOR')")
    public List<Cliente> listar(@RequestParam(defaultValue="false") boolean incluirInactivos,org.springframework.security.core.Authentication a){
        if(incluirInactivos && !administrador(a))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN,"Solo Administrador puede consultar clientes inactivos");
        return incluirInactivos?clienteRepository.findAll():clienteRepository.findByActivoTrue();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR', 'VENDEDOR')")
    public Cliente crear(@jakarta.validation.Valid @RequestBody Cliente cliente,org.springframework.security.core.Authentication a){
        if(cliente.getId()!=null)throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"Para editar un cliente utiliza su endpoint de actualización");
        if(!administrador(a))cliente.setActivo(true);
        return clienteRepository.save(cliente);
    }

    @PutMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR', 'VENDEDOR')")
    public Cliente actualizar(@PathVariable UUID id, @jakarta.validation.Valid @RequestBody Cliente datos,org.springframework.security.core.Authentication a) {
        Cliente cliente = clienteRepository.bloquear(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        if(!java.util.Objects.equals(cliente.getNombre(),datos.getNombre())){cliente.setNombres(null);cliente.setApellidos(null);}
        cliente.setNombre(datos.getNombre());
        cliente.setDireccion(datos.getDireccion());
        cliente.setTelefono(datos.getTelefono());
        cliente.setDocumento(datos.getDocumento());
        cliente.setCorreo(datos.getCorreo());
        if(!administrador(a) && cliente.isActivo()!=datos.isActivo())throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN,"Solo Administrador puede activar o desactivar clientes");
        cliente.setActivo(datos.isActivo());
        return clienteRepository.save(cliente);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public com.mijahel.backend.service.ClienteComercialService.Resultado eliminar(@PathVariable UUID id) {
        return service.eliminar(id);
    }
    private boolean administrador(org.springframework.security.core.Authentication a){return a.getAuthorities().stream().anyMatch(r->r.getAuthority().equals("ROLE_ADMINISTRADOR"));}
}
