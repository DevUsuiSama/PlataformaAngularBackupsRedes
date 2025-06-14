import { Routes } from '@angular/router';
import { Login } from './login/login';
import { AuthGuard } from './shared/guards/auth-guard';
import { Panel } from './panel/panel';
import { ErrorComponent } from './error/error-component/error-component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', // ✅ Al ingresar a localhost:4200, redirige a login
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'panel',
    component: Panel,
    canActivate: [AuthGuard], // ✅ Protege el acceso al panel
  },
  {
    path: 'error',
    component: ErrorComponent, // ✅ Página de error
  },
  {
    path: '**',
    redirectTo: 'error', // ✅ Redirige cualquier ruta desconocida a la página de error
    pathMatch: 'full',
  }
];

