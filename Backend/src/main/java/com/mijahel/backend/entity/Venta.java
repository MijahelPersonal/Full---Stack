package com.mijahel.backend.entity;
import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name="ventas")
public class Venta {
 private String origen="POS";public String getOrigen(){return origen;}public void setOrigen(String v){origen=v;}
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 public UUID getId(){return id;}
 @Column(nullable=false, unique=true)
 private String numero;
 public String getNumero(){return numero;}
 public void setNumero(String value){this.numero=value;}

 private UUID clienteId;
 public UUID getClienteId(){return clienteId;}
 public void setClienteId(UUID value){this.clienteId=value;}

 private String clienteNombre;
 public String getClienteNombre(){return clienteNombre;}
 public void setClienteNombre(String value){this.clienteNombre=value;}

 private UUID vendedorId;
 public UUID getVendedorId(){return vendedorId;}
 public void setVendedorId(UUID value){this.vendedorId=value;}

 private String vendedorNombre;
 public String getVendedorNombre(){return vendedorNombre;}
 public void setVendedorNombre(String value){this.vendedorNombre=value;}
 @Column(nullable=false, precision=14, scale=2)
 private BigDecimal total;
 public BigDecimal getTotal(){return total;}
 public void setTotal(BigDecimal value){this.total=value;}

 private String estado;
 public String getEstado(){return estado;}
 public void setEstado(String value){this.estado=value;}
 @Column(nullable=false, unique=true)
 private UUID clave;
 public UUID getClave(){return clave;}
 public void setClave(UUID value){this.clave=value;}

 private LocalDateTime fecha;
 public LocalDateTime getFecha(){return fecha;}
 public void setFecha(LocalDateTime value){this.fecha=value;}
}
