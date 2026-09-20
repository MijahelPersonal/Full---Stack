package com.mijahel.backend.controller;
import com.mijahel.backend.entity.Tecnico;
import com.mijahel.backend.repository.TecnicoRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.mijahel.backend.entity.EstadoServicio;
import com.mijahel.backend.entity.Servicio;
import com.mijahel.backend.entity.Usuario;
import com.mijahel.backend.security.UsuarioDetails;
import com.mijahel.backend.repository.ServicioRepository;
import com.mijahel.backend.service.ServicioService;
import org.springframework.web.bind.annotation.*;

import java.security.Provider;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    private final ServicioService servicioService;
    private final ServicioRepository servicioRepository;
    private final TecnicoRepository tecnicoRepository;

    public ServicioController(ServicioService servicioService, ServicioRepository servicioRepository, TecnicoRepository tecnicoRepository) {
        this.servicioService = servicioService;
        this.servicioRepository = servicioRepository;
        this.tecnicoRepository = tecnicoRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR', 'TECNICO')")
    public List<Servicio> listar() {
        return servicioRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERVISOR')")
    public Servicio crear(@RequestBody Servicio servicio) {
        return servicioService.crear(servicio);
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'TECNICO')")
    public Servicio cambiarEstado(@PathVariable UUID id,
                                  @RequestParam EstadoServicio nuevoEstado,
                                  @RequestParam String observacion,
                                  Authentication authentication) {
        Usuario usuarioAutenticado = ((UsuarioDetails) authentication.getPrincipal()).getUsuario();
        return servicioService.cambiarEstado(id, nuevoEstado, usuarioAutenticado, observacion);
    }
    @PutMapping("/{id}/asignar-tecnico")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public Servicio asignarTecnico(@PathVariable UUID id,
                                   @RequestParam UUID tecnicoId,
                                   Authentication authentication){
        Usuario usuarioAutenticado = ((UsuarioDetails)authentication.getPrincipal()).getUsuario();
        Tecnico tecnico = tecnicoRepository.findById(tecnicoId)
                .orElseThrow(() -> new RuntimeException("Tecnio no encontrado"));
        return servicioService.asignarTecnico(id, tecnico, usuarioAutenticado);
    }
}