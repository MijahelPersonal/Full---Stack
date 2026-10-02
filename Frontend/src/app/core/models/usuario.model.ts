export type Rol = 'ADMINISTRADOR' | 'SUPERVISOR' | 'TECNICO';

export interface Usuario{
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}
export interface AuthResponse{
  token: string;
  email: string;
  rol: Rol;
}
export interface LoginRequest{
  email: string;
  password: string;
}
export interface RegisterRequest{
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
}
