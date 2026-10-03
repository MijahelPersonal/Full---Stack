package com.mijahel.backend.dto;
import jakarta.validation.Valid;import jakarta.validation.constraints.*;import java.util.*;import java.math.BigDecimal;import com.mijahel.backend.entity.*;import com.mijahel.backend.dto.ComercioDTO.LineaRequest;
public final class TiendaDTO {
 public record Registro(@NotBlank @Size(max=80) String nombres,@NotBlank @Size(max=79) String apellidos,@NotBlank @Email @Size(max=160) String email,@NotBlank @Size(min=8,max=72) String password,@NotBlank @Size(max=30) String telefono,@Size(max=30) String documento){}
 public record Login(@NotBlank @Email @Size(max=160) String email,@NotBlank @Size(max=72) String password){}
 public record Cuenta(UUID id,String nombre,String email,String telefono,String documento){}
 public record Sesion(String token,Cuenta cuenta){}
 public record CrearPedido(@NotNull UUID clave,@NotEmpty @Size(max=30) List<@Valid LineaRequest> lineas){}
 public record Linea(UUID productoId,String skuHistorico,String nombreHistorico,int cantidad,BigDecimal precioUnitario,BigDecimal subtotal){}
 public record PedidoVista(UUID id,String numeroPedido,String codigoRecojo,String clienteNombre,java.time.LocalDateTime fechaCreacion,java.time.LocalDateTime fechaConfirmacion,java.time.LocalDateTime fechaListo,java.time.LocalDateTime fechaEntrega,String estado,BigDecimal total,String modalidad,UUID ventaId,List<Linea> detalles){}
 public record PedidoInterno(PedidoVista pedido,Map<UUID,Integer> stockActual){}
 public record ProductoVendido(String nombre,long cantidad,BigDecimal importe){}
 public record Reporte(String periodo,long ventas,BigDecimal importe,long ventasWeb,long ventasPos,BigDecimal importeWeb,BigDecimal importePos,long pendientes,long entregados,List<ProductoVendido> masVendidos,List<Producto> stockBajo){}
}
