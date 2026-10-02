package com.mijahel.backend.entity;
import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name="detalle_ventas")
public class DetalleVenta {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 public UUID getId(){return id;}

 private UUID ventaId;
 public UUID getVentaId(){return ventaId;}
 public void setVentaId(UUID value){this.ventaId=value;}

 private UUID productoId;
 public UUID getProductoId(){return productoId;}
 public void setProductoId(UUID value){this.productoId=value;}
 @Column(nullable=false, unique=true)
 private String sku;
 public String getSku(){return sku;}
 public void setSku(String value){this.sku=value;}

 private String nombre;
 public String getNombre(){return nombre;}
 public void setNombre(String value){this.nombre=value;}

 private int cantidad;
 public int getCantidad(){return cantidad;}
 public void setCantidad(int value){this.cantidad=value;}
 @Column(nullable=false, precision=14, scale=2)
 private BigDecimal precioUnitario;
 public BigDecimal getPrecioUnitario(){return precioUnitario;}
 public void setPrecioUnitario(BigDecimal value){this.precioUnitario=value;}
 @Column(nullable=false, precision=14, scale=2)
 private BigDecimal subtotal;
 public BigDecimal getSubtotal(){return subtotal;}
 public void setSubtotal(BigDecimal value){this.subtotal=value;}
}
