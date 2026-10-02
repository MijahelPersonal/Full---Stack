package com.mijahel.backend.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import jakarta.servlet.FilterChain;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthFilterTest {
 @AfterEach void limpiar(){SecurityContextHolder.clearContext();}
 @Test void usuarioInactivoNoEstableceAuthenticationNiEjecutaEndpoint() throws Exception {
   JwtService jwt=mock(JwtService.class);CustomUserDetailsService usuarios=mock(CustomUserDetailsService.class);
   when(jwt.extraerUsername("token-valido")).thenReturn("usuario");
   when(usuarios.loadUserByUsername("usuario")).thenReturn(User.withUsername("usuario").password("hash").roles("VENDEDOR").disabled(true).build());
   var request=new MockHttpServletRequest();request.addHeader("Authorization","Bearer token-valido");
   var response=new MockHttpServletResponse();FilterChain chain=mock(FilterChain.class);
   // Ni siquiera una autenticación previa puede sobrevivir al rechazo.
   SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("previo","",java.util.List.of()));
   new JwtAuthFilter(jwt,usuarios).doFilter(request,response,chain);
   assertEquals(401,response.getStatus());assertNull(SecurityContextHolder.getContext().getAuthentication());verifyNoInteractions(chain);
   verify(usuarios).loadUserByUsername("usuario");
 }
}
