package com.mijahel.backend.service;
import com.mijahel.backend.dto.CatalogoPublicoDTO.*;
import com.mijahel.backend.entity.Producto;
import com.mijahel.backend.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
@Service
@Transactional(readOnly=true)
public class CatalogoPublicoService {
 private final ProductoRepository productos;
 public CatalogoPublicoService(ProductoRepository p){productos=p;}
 private ResponseStatusException invalido(){return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Filtros de catálogo inválidos");}
 public Pagina listar(String q,String categoria,String marca,String disponibilidad,BigDecimal min,BigDecimal max,String orden,int pagina,int tamano,Boolean destacado,Boolean oferta){
   if(pagina<0||pagina>10000||tamano<1||tamano>48||q.length()>120||categoria.length()>80||marca.length()>80||
     (min!=null&&min.signum()<0)||(max!=null&&max.signum()<0)||(min!=null&&max!=null&&min.compareTo(max)>0))throw invalido();
   String campo=switch(orden){case "recientes"->"creadoEn";case "precio-menor","precio-mayor"->"precioVenta";case "destacados"->"destacado";default->throw invalido();};
   if(!Set.of("","con-stock","sin-stock").contains(disponibilidad))throw invalido();
   Sort.Direction direction=orden.equals("precio-menor")?Sort.Direction.ASC:Sort.Direction.DESC;
   Specification<Producto> filtro=(r,query,cb)->{
     List<jakarta.persistence.criteria.Predicate> f=new ArrayList<>();f.add(cb.isTrue(r.get("activo")));
     if(!q.isBlank()){
       String pattern="%"+q.trim().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%";
       f.add(cb.or(cb.like(cb.lower(r.get("nombre")),pattern,'!'),cb.like(cb.lower(r.get("marca")),pattern,'!'),cb.like(cb.lower(r.get("categoria")),pattern,'!')));
     }
     if(!categoria.isBlank())f.add(cb.equal(cb.lower(r.get("categoria")),categoria.trim().toLowerCase(Locale.ROOT)));
     if(!marca.isBlank())f.add(cb.equal(cb.lower(r.get("marca")),marca.trim().toLowerCase(Locale.ROOT)));
     if(disponibilidad.equals("con-stock"))f.add(cb.greaterThan(r.get("stock"),0));
     if(disponibilidad.equals("sin-stock"))f.add(cb.equal(r.get("stock"),0));
     if(min!=null)f.add(cb.greaterThanOrEqualTo(r.get("precioVenta"),min));
     if(max!=null)f.add(cb.lessThanOrEqualTo(r.get("precioVenta"),max));
     if(Boolean.TRUE.equals(destacado))f.add(cb.isTrue(r.get("destacado")));
     if(Boolean.TRUE.equals(oferta))f.add(cb.greaterThan(r.<BigDecimal>get("precioAnterior"),r.<BigDecimal>get("precioVenta")));
     return cb.and(f.toArray(jakarta.persistence.criteria.Predicate[]::new));
   };
   var resultado=productos.findAll(filtro,PageRequest.of(pagina,tamano,Sort.by(direction,campo).and(Sort.by("id"))));
   return new Pagina(resultado.getContent().stream().map(this::card).toList(),resultado.getTotalElements(),pagina,resultado.getTotalPages(),tamano);
 }
 private BigDecimal anterior(Producto p){return p.getPrecioAnterior()!=null&&p.getPrecioAnterior().compareTo(p.getPrecioVenta())>0?p.getPrecioAnterior():null;}
 private String imagen(Producto p){String u=p.getImagenUrl();return u!=null&&u.matches("/api/productos/imagenes/[0-9a-f-]{36}\\.(jpg|png|webp)")?u:null;}
 private ProductoCard card(Producto p){return new ProductoCard(p.getId(),p.getSlug(),p.getNombre(),p.getCategoria(),p.getMarca(),p.getPrecioVenta(),anterior(p),p.getStock(),p.isDestacado(),imagen(p));}
 public ProductoDetalle detalle(String slug){
   Producto p=productos.findBySlugAndActivoTrue(slug).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Producto no encontrado"));
   return new ProductoDetalle(p.getId(),p.getSlug(),p.getNombre(),p.getCategoria(),p.getMarca(),p.getPrecioVenta(),anterior(p),p.getStock(),p.isDestacado(),imagen(p),p.getDescripcion(),p.getEspecificaciones());
 }
 public List<String> categorias(){return productos.categoriasPublicas();}
 public List<String> marcas(){return productos.marcasPublicas();}
}
