export interface Producto { id:string; sku:string; nombre:string; categoria:string; marca:string; precioCompra:number; precioVenta:number; stock:number; stockMinimo:number; activo:boolean; imagenUrl?:string|null; slug?:string; descripcion?:string; especificaciones?:Record<string,string>; destacado?:boolean; precioAnterior?:number|null; }
export interface ClienteComercial { id:string; nombre:string; telefono:string; direccion:string; documento:string; correo:string; activo:boolean; }
export interface Venta { origen:"POS"|"WEB"; id:string; numero:string; fecha:string; clienteNombre:string; vendedorNombre:string; total:number; estado:string; }
export interface DetalleVenta { id:string; nombre:string; sku:string; cantidad:number; precioUnitario:number; subtotal:number; }
export interface VentaDetalle { venta:Venta; detalles:DetalleVenta[]; }
export interface Movimiento { id:string; productoId:string; productoNombre:string; tipo:string; cantidad:number; stockAnterior:number; stockPosterior:number; motivo:string; responsable:string; fecha:string; }
export interface InicioResumen { ventasHoy:number; totalHoy:number; productos:number; stockBajo:number; ultimasVentas:Venta[]; reposicion:Producto[]; }

export interface Pedido {id:string;numeroPedido:string;codigoRecojo:string;clienteNombre:string;fechaCreacion:string;estado:string;total:number;ventaId:string|null;detalles:{productoId:string;skuHistorico:string;nombreHistorico:string;cantidad:number;precioUnitario:number;subtotal:number}[];}
export interface PedidoInterno {pedido:Pedido;stockActual:Record<string,number>;}
export interface Reporte {periodo:string;ventas:number;importe:number;ventasWeb:number;ventasPos:number;importeWeb:number;importePos:number;pendientes:number;entregados:number;masVendidos:{nombre:string;cantidad:number;importe:number}[];stockBajo:Producto[];}
