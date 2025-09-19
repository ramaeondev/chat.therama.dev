import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Dashboard } from './feature/dashboard/dashboard';


export const routes: Routes = [ 
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  { path: 'signin', component: Login },
  { path: 'signup', component: Signup },
  { path: 'dashboard', component: Dashboard },
  { path: '**', redirectTo: '' },
];
