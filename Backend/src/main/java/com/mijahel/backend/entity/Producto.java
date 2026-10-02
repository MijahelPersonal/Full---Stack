package com.mijahel.backend.entity;
import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name="productos")
public class Producto {
 private String imagenUrl;
 public String getImagenUrl(){return imagenUrl;}
 public void setImagenUrl(String value){imagenUrl=value;}
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 public UUID getId(){return id;}
 @Column(nullable=false, unique=true)
 private String sku;
 public String getSku(){return sku;}
 public void setSku(String value){this.sku=value;}

 private String nombre;
 public String getNombre(){return nombre;}
 public void setNombre(String value){this.nombre=value;}

 private String categoria;
 public String getCategoria(){return categoria;}
 public void setCategoria(String value){this.categoria=value;}

 private String marca;
 public String getMarca(){return marca;}
 public void setMarca(String value){this.marca=value;}
 @Column(nullable=false, precision=14, scale=2)
 private BigDecimal precioCompra;
 public BigDecimal getPrecioCompra(){return precioCompra;}
 public void setPrecioCompra(BigDecimal value){this.precioCompra=value;}
 @Column(nullable=false, precision=14, scale=2)
 private BigDecimal precioVenta;
 public BigDecimal getPrecioVenta(){return precioVenta;}
 public void setPrecioVenta(BigDecimal value){this.precioVenta=value;}

 private int stock;
 public int getStock(){return stock;}
 public void setStock(int value){this.stock=value;}

 private int stockMinimo;
 public int getStockMinimo(){return stockMinimo;}
 public void setStockMinimo(int value){this.stockMinimo=value;}

 private boolean activo;
 public boolean getActivo(){return activo;}
 public void setActivo(boolean value){this.activo=value;}
}
