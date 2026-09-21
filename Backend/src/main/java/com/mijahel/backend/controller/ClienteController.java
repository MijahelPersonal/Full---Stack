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

    public ClienteController(ClienteRepository clienteRepository){
        this.clienteRepository = clienteRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    public List<Cliente> listar(){
        return clienteRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    public Cliente crear(@RequestBody Cliente cliente){
        return clienteRepository.save(cliente);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    public Cliente actualizar(@PathVariable UUID id, @RequestBody Cliente datos) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        cliente.setNombre(datos.getNombre());
        cliente.setDireccion(datos.getDireccion());
        cliente.setTelefono(datos.getTelefono());
        return clienteRepository.save(cliente);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public void eliminar(@PathVariable UUID id) {
        clienteRepository.deleteById(id);
    }
}