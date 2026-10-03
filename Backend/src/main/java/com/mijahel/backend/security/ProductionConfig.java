package com.mijahel.backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import java.net.URI;
import java.nio.file.Path;

@Configuration
@Profile("prod")
public class ProductionConfig {
 public ProductionConfig(Environment env) {
  URI frontend=URI.create(env.getRequiredProperty("app.web.allowed-origins"));
  if(!"https".equals(frontend.getScheme()) || frontend.getHost()==null || frontend.getUserInfo()!=null || frontend.getQuery()!=null || frontend.getFragment()!=null || !frontend.getPath().isEmpty() || java.util.Set.of("localhost","127.0.0.1","::1").contains(frontend.getHost()))
   throw new IllegalArgumentException("FRONTEND_URL debe ser un origen HTTPS público sin ruta");
  if(!env.getRequiredProperty("spring.datasource.url").startsWith("jdbc:postgresql://"))
   throw new IllegalArgumentException("DATABASE_URL debe tener formato JDBC PostgreSQL");
  if(!Path.of(env.getRequiredProperty("app.productos.upload-dir")).isAbsolute())
   throw new IllegalArgumentException("UPLOAD_DIR debe ser absoluto en producción");
  String secret=env.getRequiredProperty("app.jwt.secret");
  if(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length<32 || secret.contains("CambiaEstaClave") || secret.contains("REEMPLAZAR"))
   throw new IllegalArgumentException("JWT_SECRET debe ser una clave nueva de al menos 32 bytes");
 }
}
