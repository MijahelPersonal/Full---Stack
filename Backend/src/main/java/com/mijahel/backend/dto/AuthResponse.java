package com.mijahel.backend.dto;

public class AuthResponse {
    private String token;
    private String username;
    private String rol;

    public AuthResponse(String token, String username, String rol){
        this.token = token;
        this.username = username;
        this.rol = rol;
    }

    public String getToken() {
        return token;
    }

    public String getUsername() {
        return username;
    }

    public String getRol() {
        return rol;
    }
}
