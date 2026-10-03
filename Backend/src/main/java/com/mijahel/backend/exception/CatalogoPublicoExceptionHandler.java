package com.mijahel.backend.exception;

import com.mijahel.backend.controller.CatalogoPublicoController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

/** Los errores públicos nunca incluyen SQL, entidades ni detalles internos. */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes=CatalogoPublicoController.class)
public class CatalogoPublicoExceptionHandler {
 private static final Logger log=LoggerFactory.getLogger(CatalogoPublicoExceptionHandler.class);
 @ExceptionHandler(ResponseStatusException.class)
 ResponseEntity<?> estado(ResponseStatusException e){int status=e.getStatusCode().value();return ResponseEntity.status(status).body(Map.of("status",status,"error",status==404?"Producto no encontrado":"Filtros de catálogo inválidos"));}
 @ExceptionHandler(MethodArgumentTypeMismatchException.class)
 ResponseEntity<?> filtros(){return ResponseEntity.badRequest().body(Map.of("status",400,"error","Filtros de catálogo inválidos"));}
 @ExceptionHandler(Exception.class)
 ResponseEntity<?> inesperado(Exception e){log.error("Error al consultar el catálogo público",e);return ResponseEntity.internalServerError().body(Map.of("status",500,"error","Catálogo temporalmente no disponible"));}
}
