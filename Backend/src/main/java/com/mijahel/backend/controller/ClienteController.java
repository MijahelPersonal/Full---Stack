package com.mijahel.backend.controller;

import com.mijahel.backend.entity.Cliente;
import com.mijahel.backend.repository.ClienteRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cliente")
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
}
