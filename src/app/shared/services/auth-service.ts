// src/app/shared/services/auth-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router }     from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, of }  from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../models/login-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly API_URL = environment.apiUrl + "/api/auth";

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService
  ) {}

  /** Llama al endpoint /auth/login y devuelve {token} o {error} */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<{ token: string }>(
        `${this.API_URL}/login`,
        { username, password }
      )
      .pipe(
        map(resp => ({ token: resp.token })),
        catchError(err => {
          const msg = err.error?.error || err.error?.message || 'LOGIN FAILED';
          return of({ error: msg });
        })
      );
  }

  setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  logout() {
    this.clearToken();
    this.router.navigate(['/login']);
  }
}
