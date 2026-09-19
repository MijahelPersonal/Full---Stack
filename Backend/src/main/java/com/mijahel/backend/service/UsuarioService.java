package com.mijahel.backend.service;

import com.mijahel.backend.dto.UsuarioResponseDTO;
import com.mijahel.backend.entity.Usuario;
import com.mijahel.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(u -> new UsuarioResponseDTO(u.getId(), u.getNombre(), u.getEmail(), u.getRol(), u.isActivo()))
                .collect(Collectors.toList());
    }
}
