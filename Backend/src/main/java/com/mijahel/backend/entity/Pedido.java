package com.mijahel.backend.entity;
import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name="pedidos")
public class Pedido {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 public UUID getId(){return id;}
 private UUID cuentaId;
 public UUID getCuentaId(){return cuentaId;}
 public void setCuentaId(UUID value){cuentaId=value;}
 private UUID clienteId;
 public UUID getClienteId(){return clienteId;}
 public void setClienteId(UUID value){clienteId=value;}
 private String clienteNombre;
 public String getClienteNombre(){return clienteNombre;}
 public void setClienteNombre(String value){clienteNombre=value;}
 private UUID clave;
 public UUID getClave(){return clave;}
 public void setClave(UUID value){clave=value;}
 private String numeroPedido;
 public String getNumeroPedido(){return numeroPedido;}
 public void setNumeroPedido(String value){numeroPedido=value;}
 private String codigoRecojo;
 public String getCodigoRecojo(){return codigoRecojo;}
 public void setCodigoRecojo(String value){codigoRecojo=value;}
 private String estado;
 public String getEstado(){return estado;}
 public void setEstado(String value){estado=value;}
@Column(precision=14,scale=2) private BigDecimal total;
 public BigDecimal getTotal(){return total;}
 public void setTotal(BigDecimal value){total=value;}
 private UUID ventaId;
 public UUID getVentaId(){return ventaId;}
 public void setVentaId(UUID value){ventaId=value;}
 private LocalDateTime fechaCreacion;
 public LocalDateTime getFechaCreacion(){return fechaCreacion;}
 public void setFechaCreacion(LocalDateTime value){fechaCreacion=value;}
 private LocalDateTime fechaConfirmacion;
 public LocalDateTime getFechaConfirmacion(){return fechaConfirmacion;}
 public void setFechaConfirmacion(LocalDateTime value){fechaConfirmacion=value;}
 private LocalDateTime fechaListo;
 public LocalDateTime getFechaListo(){return fechaListo;}
 public void setFechaListo(LocalDateTime value){fechaListo=value;}
 private LocalDateTime fechaEntrega;
 public LocalDateTime getFechaEntrega(){return fechaEntrega;}
 public void setFechaEntrega(LocalDateTime value){fechaEntrega=value;}
}
