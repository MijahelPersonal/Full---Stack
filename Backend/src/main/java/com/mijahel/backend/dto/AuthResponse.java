package com.mijahel.backend.dto;

public class AuthResponse {
    private String token;
    private String email;
    private String rol;

    public AuthResponse(String token, String email, String rol){
        this.token = token;
        this.email = email;
        this.rol = rol;
    }

    public String getToken() {
        return token;
    }

    public String getEmail() {
        return email;
    }

    public String getRol() {
        return rol;
    }
}
