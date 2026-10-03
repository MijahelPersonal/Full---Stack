package com.mijahel.backend.service;
import com.mijahel.backend.entity.*;import com.mijahel.backend.repository.*;import com.mijahel.backend.dto.TiendaDTO.*;import com.mijahel.backend.security.ClienteJwtService;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import org.springframework.security.crypto.password.PasswordEncoder;import org.springframework.web.server.ResponseStatusException;import org.springframework.http.HttpStatus;import java.util.*;
@Service public class CuentaClienteService {
 private final CuentaClienteRepository cuentas;private final ClienteRepository clientes;private final PasswordEncoder encoder;private final ClienteJwtService jwt;private final String hashDummy;
 public CuentaClienteService(CuentaClienteRepository a,ClienteRepository c,PasswordEncoder e,ClienteJwtService j){cuentas=a;clientes=c;encoder=e;jwt=j;hashDummy=e.encode(UUID.randomUUID().toString());}
 @Transactional public Sesion registrar(Registro r){
  if(r.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"La contraseña supera el límite de 72 bytes");
  String email=r.email().trim().toLowerCase(Locale.ROOT);if(cuentas.findByEmail(email).isPresent())throw new ResponseStatusException(HttpStatus.CONFLICT,"Ya existe una cuenta con ese correo");
  // No se vincula automáticamente por correo con clientes creados por empleados.
  Cliente c=new Cliente();c.setNombres(r.nombres().trim());c.setApellidos(r.apellidos().trim());c.setNombre(r.nombres().trim()+" "+r.apellidos().trim());c.setCorreo(email);c.setTelefono(r.telefono().trim());c.setDocumento(r.documento());c=clientes.saveAndFlush(c);
  CuentaCliente a=new CuentaCliente();a.setClienteId(c.getId());a.setEmail(email);a.setPasswordHash(encoder.encode(r.password()));a.setActivo(true);a.setFechaCreacion(java.time.LocalDateTime.now());
  try{a=cuentas.saveAndFlush(a);}catch(org.springframework.dao.DataIntegrityViolationException ex){throw new ResponseStatusException(HttpStatus.CONFLICT,"Ya existe una cuenta con ese correo");}return new Sesion(jwt.crear(a.getId()),vista(a));
 }
 public Sesion login(Login r){CuentaCliente a=cuentas.findByEmail(r.email().trim().toLowerCase(Locale.ROOT)).orElse(null);boolean valida=encoder.matches(r.password(),a==null?hashDummy:a.getPasswordHash());if(a==null||!valida)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Correo o contraseña incorrectos");activa(a.getId());return new Sesion(jwt.crear(a.getId()),vista(a));}
 public CuentaCliente activa(UUID id){CuentaCliente a=cuentas.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Sesión inválida"));if(!a.getActivo()||!clientes.findById(a.getClienteId()).map(Cliente::isActivo).orElse(false))throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Cuenta inactiva");return a;}
 public Cuenta vista(CuentaCliente a){Cliente c=clientes.findById(a.getClienteId()).orElseThrow();return new Cuenta(a.getId(),c.getNombre(),a.getEmail(),c.getTelefono(),c.getDocumento());}
}
