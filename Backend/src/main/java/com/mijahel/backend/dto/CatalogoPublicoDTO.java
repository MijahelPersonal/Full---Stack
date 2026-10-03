package com.mijahel.backend.dto;
import java.util.*;
import java.math.BigDecimal;
public final class CatalogoPublicoDTO {
 public record ProductoCard(UUID id,String slug,String nombre,String categoria,String marca,
   BigDecimal precio,BigDecimal precioAnterior,int stock,boolean destacado,String imagenUrl) {}
 public record ProductoDetalle(UUID id,String slug,String nombre,String categoria,String marca,
   BigDecimal precio,BigDecimal precioAnterior,int stock,boolean destacado,String imagenUrl,
   String descripcion,Map<String,String> especificaciones) {}
 public record Pagina(List<ProductoCard> items,long total,int pagina,int paginas,int tamano) {}
}
