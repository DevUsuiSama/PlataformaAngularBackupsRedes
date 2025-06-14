import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';

import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth-interceptor'; // ✅ Importa el interceptor

export function tokenGetter() {
  return localStorage.getItem('jwt'); // ✅ Obtiene el token guardado
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])), // ✅ Ahora incluye el interceptor
    importProvidersFrom( // ✅ Importa el módulo correctamente
      JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
          allowedDomains: ['localhost:8080'], // ✅ Configura el acceso al backend
        },
      })
    ),
  ]
};

