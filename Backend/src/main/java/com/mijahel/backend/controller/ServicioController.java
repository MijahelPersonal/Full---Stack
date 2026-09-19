package com.mijahel.backend.controller;

import com.mijahel.backend.entity.EstadoServicio;
import com.mijahel.backend.entity.Servicio;
import com.mijahel.backend.repository.ServicioRepository;
import com.mijahel.backend.service.ServicioService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    private final ServicioService servicioService;
    private final ServicioRepository servicioRepository;

    public ServicioController(ServicioService servicioService, ServicioRepository servicioRepository) {
        this.servicioService = servicioService;
        this.servicioRepository = servicioRepository;
    }

    @GetMapping
    public List<Servicio> listar() {
        return servicioRepository.findAll();
    }

    @PostMapping
    public Servicio crear(@RequestBody Servicio servicio) {
        return servicioService.crear(servicio);
    }

    @PutMapping("/{id}/estado")
    public Servicio cambiarEstado(@PathVariable UUID id, @RequestParam EstadoServicio nuevoEstado,
                                  @RequestParam String observacion) {
        // usuarioQueCambia vendrá del JWT en la Fase 3 — por ahora lo dejamos pendiente
        return null; // placeholder, lo completamos cuando tengamos seguridad
    }
}