package com.mijahel.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @org.springframework.beans.factory.annotation.Value("${app.web.allowed-origins:http://localhost:4321,http://127.0.0.1:4321}")
    private String webOrigins;

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, CustomUserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean @org.springframework.core.annotation.Order(1)
    public SecurityFilterChain clientesChain(HttpSecurity http,ClienteJwtService jwt,com.mijahel.backend.service.CuentaClienteService cuentas) throws Exception {
        return http.securityMatcher("/api/tienda/**").csrf(c->c.disable())
          .sessionManagement(c->c.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          .authorizeHttpRequests(c->c.requestMatchers(org.springframework.http.HttpMethod.POST,"/api/tienda/auth/login","/api/tienda/auth/registro").permitAll().anyRequest().hasRole("CLIENTE_WEB"))
          .exceptionHandling(c->c.authenticationEntryPoint((r,s,e)->s.sendError(401)))
          .addFilterBefore(new ClienteJwtFilter(jwt,cuentas),UsernamePasswordAuthenticationFilter.class).build();
    }
    @Bean @org.springframework.core.annotation.Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // ← agregar esta línea
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/public/productos","/api/public/productos/*","/api/public/categorias","/api/public/marcas").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/productos/imagenes/*").permitAll()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200", "app://gestion"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration publico=new CorsConfiguration();
        publico.setAllowedOrigins(java.util.Arrays.stream(webOrigins.split(",")).map(String::trim).filter(s->!s.isEmpty()).toList());
        publico.setAllowedMethods(List.of("GET","HEAD"));
        publico.setAllowedHeaders(List.of("Accept","Content-Type"));
        source.registerCorsConfiguration("/api/public/**",publico);
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
