import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params });
  }

  post<T>(path: string, body: any, params?: Record<string, any>): Observable<T> {
  return this.http.post<T>(`${this.baseUrl}${path}`, body, { params });
  }

  put<T>(path: string, body?: any, params?: Record<string, any>): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body ?? {}, { params });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }
}
