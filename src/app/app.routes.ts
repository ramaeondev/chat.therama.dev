import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Dashboard } from './feature/dashboard/dashboard';
import { LandingComponent } from './feature/landing/landing';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

// Lazy load admin components
const loadAdminDashboard = () => import('./admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent);

export const routes: Routes = [
  // Public routes
  { path: '', component: LandingComponent },
  { path: 'signin', component: Login },
  { path: 'signup', component: Signup },
  
  // User dashboard
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  
  // Admin dashboard route (protected by admin guard)
  { 
    path: 'admin', 
    loadComponent: loadAdminDashboard,
    canActivate: [adminGuard]
  },
  
  // Catch-all route
  { path: '**', redirectTo: '' },
];
