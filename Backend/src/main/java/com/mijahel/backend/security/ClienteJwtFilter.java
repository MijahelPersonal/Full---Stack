package com.mijahel.backend.security;
import org.springframework.web.filter.OncePerRequestFilter;import jakarta.servlet.*;import jakarta.servlet.http.*;import java.io.IOException;import java.util.List;import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;import org.springframework.security.core.authority.SimpleGrantedAuthority;import org.springframework.security.core.context.SecurityContextHolder;import com.mijahel.backend.service.CuentaClienteService;
public class ClienteJwtFilter extends OncePerRequestFilter {
 private final ClienteJwtService jwt;private final CuentaClienteService cuentas;
 public ClienteJwtFilter(ClienteJwtService j,CuentaClienteService c){jwt=j;cuentas=c;}
 protected void doFilterInternal(HttpServletRequest r,HttpServletResponse s,FilterChain chain)throws ServletException,IOException {
  String header=r.getHeader("Authorization");if(header!=null&&header.startsWith("Bearer ")){try{var a=cuentas.activa(jwt.validar(header.substring(7)));SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(a.getId(),null,List.of(new SimpleGrantedAuthority("ROLE_CLIENTE_WEB"))));}catch(io.jsonwebtoken.JwtException|IllegalArgumentException|org.springframework.web.server.ResponseStatusException ex){SecurityContextHolder.clearContext();s.setStatus(401);s.setContentType("application/json;charset=UTF-8");s.getWriter().write("{\"error\":\"Sesión inválida o cuenta inactiva\"}");return;}}chain.doFilter(r,s);
 }
}
