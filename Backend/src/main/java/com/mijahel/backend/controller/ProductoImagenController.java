package com.mijahel.backend.controller;
import com.mijahel.backend.service.ProductoImagenService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.core.io.Resource;
@RestController
public class ProductoImagenController {
 private final ProductoImagenService imagenes;
 public ProductoImagenController(ProductoImagenService i){imagenes=i;}
 @GetMapping("/api/productos/imagenes/{nombre}")
 public ResponseEntity<Resource> imagen(@PathVariable String nombre){
   MediaType tipo=nombre.endsWith(".jpg")?MediaType.IMAGE_JPEG:nombre.endsWith(".png")?MediaType.IMAGE_PNG:MediaType.parseMediaType("image/webp");
   return ResponseEntity.ok().contentType(tipo).header("X-Content-Type-Options","nosniff").cacheControl(CacheControl.noCache()).body(imagenes.leer(nombre));
 }
}
