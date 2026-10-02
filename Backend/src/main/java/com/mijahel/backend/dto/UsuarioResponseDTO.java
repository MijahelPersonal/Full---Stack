package com.mijahel.backend.dto;

import com.mijahel.backend.entity.Rol;
import java.util.UUID;

public class UsuarioResponseDTO {
    private UUID id;
    private String nombre;
    private String username;
    private String email;
    private Rol rol;
    private boolean activo;

    public UsuarioResponseDTO(UUID id, String nombre, String username, String email, Rol rol, boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.username = username;
        this.email = email;
        this.rol = rol;
        this.activo = activo;
    }

    public UUID getId() { return id; }
    public String getNombre() { return nombre; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public Rol getRol() { return rol; }
    public boolean isActivo() { return activo; }
}
