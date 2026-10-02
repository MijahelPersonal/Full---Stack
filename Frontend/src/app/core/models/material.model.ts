export interface Material {
  id: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
}

export interface ServicioMaterial {
  id: string;
  servicio: { id: string };
  material: Material;
  cantidadSolicitada: number;
  cantidadUtilizada: number;
}
