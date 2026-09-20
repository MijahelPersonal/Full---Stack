package com.mijahel.backend.controller;

import com.mijahel.backend.entity.Tecnico;
import com.mijahel.backend.entity.Usuario;
import com.mijahel.backend.repository.TecnicoRepository;
import com.mijahel.backend.repository.UsuarioRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tecnicos")
public class TecnicoController {

    private final TecnicoRepository tecnicoRepository;
    private final UsuarioRepository usuarioRepository;

    public TecnicoController(TecnicoRepository tecnicoRepository, UsuarioRepository usuarioRepository) {
        this.tecnicoRepository = tecnicoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    public List<Tecnico> listar() {
        return tecnicoRepository.findAll();
    }

    // Convierte un Usuario con rol TECNICO ya existente en un registro Tecnico operativo
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public Tecnico crear(@RequestParam UUID usuarioId, @RequestParam String especialidad) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Tecnico tecnico = new Tecnico();
        tecnico.setUsuario(usuario);
        tecnico.setEspecialidad(especialidad);
        tecnico.setEstadoDisponibilidad(com.mijahel.backend.entity.EstadoDisponibilidad.DISPONIBLE);

        return tecnicoRepository.save(tecnico);
    }
}
