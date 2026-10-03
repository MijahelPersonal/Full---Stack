package com.mijahel.backend.entity;
import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name="detalle_pedidos")
public class DetallePedido {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 public UUID getId(){return id;}
 private UUID pedidoId;
 public UUID getPedidoId(){return pedidoId;}
 public void setPedidoId(UUID value){pedidoId=value;}
 private UUID productoId;
 public UUID getProductoId(){return productoId;}
 public void setProductoId(UUID value){productoId=value;}
 private String skuHistorico;
 public String getSkuHistorico(){return skuHistorico;}
 public void setSkuHistorico(String value){skuHistorico=value;}
 private String nombreHistorico;
 public String getNombreHistorico(){return nombreHistorico;}
 public void setNombreHistorico(String value){nombreHistorico=value;}
 private int cantidad;
 public int getCantidad(){return cantidad;}
 public void setCantidad(int value){cantidad=value;}
@Column(precision=14,scale=2) private BigDecimal precioUnitario;
 public BigDecimal getPrecioUnitario(){return precioUnitario;}
 public void setPrecioUnitario(BigDecimal value){precioUnitario=value;}
@Column(precision=14,scale=2) private BigDecimal subtotal;
 public BigDecimal getSubtotal(){return subtotal;}
 public void setSubtotal(BigDecimal value){subtotal=value;}
}
