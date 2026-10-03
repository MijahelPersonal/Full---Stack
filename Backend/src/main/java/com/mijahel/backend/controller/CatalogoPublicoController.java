package com.mijahel.backend.controller;
import com.mijahel.backend.dto.CatalogoPublicoDTO.*;
import com.mijahel.backend.service.CatalogoPublicoService;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.util.*;
import java.math.BigDecimal;
@RestController
@RequestMapping("/api/public")
public class CatalogoPublicoController {
 private final CatalogoPublicoService catalogo;
 public CatalogoPublicoController(CatalogoPublicoService c){catalogo=c;}
 @ModelAttribute void cache(HttpServletResponse r){r.setHeader("Cache-Control","no-store");}
 @GetMapping("/productos") public Pagina productos(@RequestParam(defaultValue="") String q,@RequestParam(defaultValue="") String categoria,
   @RequestParam(defaultValue="") String marca,@RequestParam(defaultValue="") String disponibilidad,
   @RequestParam(required=false) BigDecimal min,@RequestParam(required=false) BigDecimal max,
   @RequestParam(defaultValue="recientes") String orden,@RequestParam(defaultValue="0") int pagina,@RequestParam(defaultValue="12") int tamano,
   @RequestParam(required=false) Boolean destacado,@RequestParam(required=false) Boolean oferta){
   return catalogo.listar(q,categoria,marca,disponibilidad,min,max,orden,pagina,tamano,destacado,oferta);
 }
 @GetMapping("/productos/destacados") public Pagina destacados(){return catalogo.listar("","","","",null,null,"recientes",0,8,true,null);}
 @GetMapping("/productos/ofertas") public Pagina ofertas(){return catalogo.listar("","","","",null,null,"recientes",0,8,null,true);}
 @GetMapping("/productos/{slug}") public ProductoDetalle producto(@PathVariable String slug){return catalogo.detalle(slug);}
 @GetMapping("/categorias") public List<String> categorias(){return catalogo.categorias();}
 @GetMapping("/marcas") public List<String> marcas(){return catalogo.marcas();}
}
