package com.mijahel.backend.entity;
import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name="productos")
public class Producto {
 @Column(nullable=false,unique=true,length=128) private String slug;
 @Column(columnDefinition="text",nullable=false) private String descripcion="";
 @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
 @Column(columnDefinition="jsonb",nullable=false) private java.util.Map<String,String> especificaciones=new java.util.LinkedHashMap<>();
 @Column(nullable=false) private boolean destacado;
 @Column(precision=14,scale=2) private BigDecimal precioAnterior;
 @Column(nullable=false,updatable=false) private LocalDateTime creadoEn;
 public String getSlug(){return slug;}
 public String getDescripcion(){return descripcion;}
 public void setDescripcion(String v){descripcion=v;}
 public java.util.Map<String,String> getEspecificaciones(){return especificaciones;}
 public void setEspecificaciones(java.util.Map<String,String> v){especificaciones=new java.util.LinkedHashMap<>(v);}
 public boolean isDestacado(){return destacado;}
 public void setDestacado(boolean v){destacado=v;}
 public BigDecimal getPrecioAnterior(){return precioAnterior;}
 public void setPrecioAnterior(BigDecimal v){precioAnterior=v;}
 public LocalDateTime getCreadoEn(){return creadoEn;}
 @PrePersist private void prepararCatalogo(){
   if(creadoEn==null)creadoEn=LocalDateTime.now();
   if(slug==null){
     String base=java.text.Normalizer.normalize(nombre==null?"producto":nombre,java.text.Normalizer.Form.NFD)
       .replaceAll("\\p{M}","").toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]+","-").replaceAll("^-|-$","");
     if(base.isBlank())base="producto";
     slug=base.substring(0,Math.min(base.length(),80))+"-"+(id==null?UUID.randomUUID():id);
   }
 }

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
