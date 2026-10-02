export interface Producto { id:string; sku:string; nombre:string; categoria:string; marca:string; precioCompra:number; precioVenta:number; stock:number; stockMinimo:number; activo:boolean; imagenUrl?:string|null; }
export interface ClienteComercial { id:string; nombre:string; telefono:string; direccion:string; documento:string; correo:string; activo:boolean; }
export interface Venta { id:string; numero:string; fecha:string; clienteNombre:string; vendedorNombre:string; total:number; estado:string; }
export interface DetalleVenta { id:string; nombre:string; sku:string; cantidad:number; precioUnitario:number; subtotal:number; }
export interface VentaDetalle { venta:Venta; detalles:DetalleVenta[]; }
export interface Movimiento { id:string; productoId:string; productoNombre:string; tipo:string; cantidad:number; stockAnterior:number; stockPosterior:number; motivo:string; responsable:string; fecha:string; }
export interface InicioResumen { ventasHoy:number; totalHoy:number; productos:number; stockBajo:number; ultimasVentas:Venta[]; reposicion:Producto[]; }
