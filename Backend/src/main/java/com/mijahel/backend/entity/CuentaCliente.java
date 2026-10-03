package com.mijahel.backend.entity;
import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name="cuentas_cliente")
public class CuentaCliente {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 public UUID getId(){return id;}
 private UUID clienteId;
 public UUID getClienteId(){return clienteId;}
 public void setClienteId(UUID value){clienteId=value;}
@Column(unique=true,nullable=false) private String email;
 public String getEmail(){return email;}
 public void setEmail(String value){email=value;}
@com.fasterxml.jackson.annotation.JsonIgnore private String passwordHash;
 public String getPasswordHash(){return passwordHash;}
 public void setPasswordHash(String value){passwordHash=value;}
 private boolean activo;
 public boolean getActivo(){return activo;}
 public void setActivo(boolean value){activo=value;}
 private LocalDateTime fechaCreacion;
 public LocalDateTime getFechaCreacion(){return fechaCreacion;}
 public void setFechaCreacion(LocalDateTime value){fechaCreacion=value;}
}
