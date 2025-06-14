// src/app/shared/interceptors/auth-interceptor.ts
import { inject }               from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpEvent
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError }            from 'rxjs/operators';
import { AuthService }           from '../services/auth-service';
import { JwtHelperService }      from '@auth0/angular-jwt';
import { Router }                from '@angular/router';

export const authInterceptor: HttpInterceptorFn =
  (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {

    // obtenemos servicios vía DI
    const auth    = inject(AuthService);
    const jwt     = inject(JwtHelperService);
    const router  = inject(Router);

    // 1) Clonar petición con el Bearer token si existe
    const token = auth.getToken();
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    // 2) Enviar la petición y atrapar errores
    return next(authReq).pipe(
      catchError(err => {
        const isExpired = token ? jwt.isTokenExpired(token) : true;

        // Si 401 del backend o token expirado
        if (err.status === 401 || isExpired) {
          auth.clearToken();       // elimina token
          router.navigate(['/login']); // redirige al login/panel
        }
        return throwError(() => err);
      })
    );
};
