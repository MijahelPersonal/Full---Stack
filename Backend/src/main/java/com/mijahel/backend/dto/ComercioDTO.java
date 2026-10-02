package com.mijahel.backend.dto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;
import com.mijahel.backend.entity.*;

public final class ComercioDTO {
 public record ProductoRequest(@NotBlank @Size(max=80) String sku, @NotBlank @Size(max=160) String nombre,
   @NotBlank @Size(max=80) String categoria, @NotBlank @Size(max=80) String marca,
   @NotNull @DecimalMin("0.00") @Digits(integer=12,fraction=2) BigDecimal precioCompra,
   @NotNull @DecimalMin("0.01") @Digits(integer=12,fraction=2) BigDecimal precioVenta,
   @Min(0) int stockInicial, @Min(0) int stockMinimo, boolean activo) {}
 public record MovimientoRequest(@NotNull UUID productoId, @NotBlank String tipo,
   @Min(1) int cantidad, @NotBlank @Size(max=250) String motivo) {}
 public record LineaRequest(@NotNull UUID productoId, @Min(1) int cantidad) {}
 public record VentaRequest(@NotNull UUID clave, @NotNull UUID clienteId,
   @NotEmpty @Size(max=100) List<@Valid LineaRequest> lineas) {}
 public record VentaDetalle(Venta venta, List<DetalleVenta> detalles) {}
 public record Inicio(long ventasHoy, BigDecimal totalHoy, long productos, long stockBajo,
   List<Venta> ultimasVentas, List<Producto> reposicion) {}
}
