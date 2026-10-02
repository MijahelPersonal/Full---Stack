package com.mijahel.backend.entity;
import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name="movimientos_inventario")
public class MovimientoInventario {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 public UUID getId(){return id;}

 private UUID productoId;
 public UUID getProductoId(){return productoId;}
 public void setProductoId(UUID value){this.productoId=value;}

 private String productoNombre;
 public String getProductoNombre(){return productoNombre;}
 public void setProductoNombre(String value){this.productoNombre=value;}

 private String tipo;
 public String getTipo(){return tipo;}
 public void setTipo(String value){this.tipo=value;}

 private int cantidad;
 public int getCantidad(){return cantidad;}
 public void setCantidad(int value){this.cantidad=value;}

 private int stockAnterior;
 public int getStockAnterior(){return stockAnterior;}
 public void setStockAnterior(int value){this.stockAnterior=value;}

 private int stockPosterior;
 public int getStockPosterior(){return stockPosterior;}
 public void setStockPosterior(int value){this.stockPosterior=value;}

 private String motivo;
 public String getMotivo(){return motivo;}
 public void setMotivo(String value){this.motivo=value;}

 private UUID ventaId;
 public UUID getVentaId(){return ventaId;}
 public void setVentaId(UUID value){this.ventaId=value;}

 private String responsable;
 public String getResponsable(){return responsable;}
 public void setResponsable(String value){this.responsable=value;}

 private LocalDateTime fecha;
 public LocalDateTime getFecha(){return fecha;}
 public void setFecha(LocalDateTime value){this.fecha=value;}
}
