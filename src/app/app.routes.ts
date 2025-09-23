import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Dashboard } from './feature/dashboard/dashboard';
import { LandingComponent } from './feature/landing/landing';


export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'signin', component: Login },
  { path: 'signup', component: Signup },
  { path: 'dashboard', component: Dashboard },
  { path: '**', redirectTo: '' },
];
