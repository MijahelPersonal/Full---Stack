package com.mijahel.backend.security;
import io.jsonwebtoken.Jwts;import io.jsonwebtoken.security.Keys;import org.springframework.stereotype.Service;import org.springframework.beans.factory.annotation.Value;import javax.crypto.SecretKey;import javax.crypto.Mac;import java.nio.charset.StandardCharsets;import java.util.*;
@Service public class ClienteJwtService {
 private final SecretKey key;
 public ClienteJwtService(@Value("${app.jwt.secret}") String secret){try{Mac mac=Mac.getInstance("HmacSHA256");mac.init(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)));key=Keys.hmacShaKeyFor(mac.doFinal("STRUCH:CLIENTE:JWT:v1".getBytes(StandardCharsets.UTF_8)));}catch(java.security.GeneralSecurityException e){throw new IllegalStateException(e);}}
 public String crear(UUID id){return Jwts.builder().issuer("struch-clientes").subject(id.toString()).issuedAt(new Date()).expiration(new Date(System.currentTimeMillis()+86400000)).signWith(key).compact();}
 public UUID validar(String token){return UUID.fromString(Jwts.parser().verifyWith(key).requireIssuer("struch-clientes").build().parseSignedClaims(token).getPayload().getSubject());}
}
