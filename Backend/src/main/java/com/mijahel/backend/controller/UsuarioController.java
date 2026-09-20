package com.mijahel.backend.controller;

import com.mijahel.backend.dto.UsuarioResponseDTO;
import com.mijahel.backend.service.UsuarioService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<UsuarioResponseDTO> listar() {
        return usuarioService.listarTodos();
    }
}
