export type Rol = 'ADMINISTRADOR' | 'SUPERVISOR' | 'TECNICO' | 'VENDEDOR';

export interface Usuario{
  id: string;
  nombre: string;
  username: string;
  email?: string;
  rol: Rol;
  activo: boolean;
}
export interface AuthResponse{
  token: string;
  username: string;
  rol: Rol;
}
export interface LoginRequest{
  username: string;
  password: string;
}
export interface RegisterRequest{
  nombre: string;
  username: string;
  email?: string;
  password: string;
  rol: Rol;
}
