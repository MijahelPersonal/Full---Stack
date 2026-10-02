package com.mijahel.backend.controller;

import com.mijahel.backend.dto.AuthResponse;
import com.mijahel.backend.dto.LoginRequest;
import com.mijahel.backend.dto.RegisterRequest;
import com.mijahel.backend.entity.Usuario;
import com.mijahel.backend.repository.UsuarioRepository;
import com.mijahel.backend.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMINISTRADOR')")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setUsername(request.getUsername().trim().toLowerCase(java.util.Locale.ROOT));
        usuario.setEmail(request.getEmail() == null || request.getEmail().isBlank() ? null : request.getEmail().trim());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(request.getRol());
        usuario.setActivo(true);

        usuarioRepository.save(usuario);

        String token = jwtService.generarToken(usuario.getUsername(), usuario.getRol().name());
        return new AuthResponse(token, usuario.getUsername(), usuario.getRol().name());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String username=request.getUsername().trim().toLowerCase(java.util.Locale.ROOT);
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, request.getPassword())
        );

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String token = jwtService.generarToken(usuario.getUsername(), usuario.getRol().name());
        return new AuthResponse(token, usuario.getUsername(), usuario.getRol().name());
    }
}
