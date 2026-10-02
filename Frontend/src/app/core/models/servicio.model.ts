import { Usuario } from './usuario.model';

export type EstadoServicio = 'PENDIENTE' | 'ASIGNADO' | 'EN_RUTA' | 'EN_SERVICIO' | 'FINALIZADO';
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';
export type TipoServicio = 'INSTALACION' | 'MANTENIMIENTO' | 'REPARACION';

export interface Cliente {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  latitud?: number;
  longitud?: number;
}

export interface Tecnico {
  id: string;
  usuario: Usuario;
  especialidad: string;
  estadoDisponibilidad: string;
}

export interface Servicio {
  id: string;
  cliente: Cliente;
  tecnico?: Tecnico;
  tipo: TipoServicio;
  prioridad: Prioridad;
  estado: EstadoServicio;
  descripcion: string;
  fechaProgramada?: string;
  fechaCreacion: string;
}
