import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';


export const routes: Routes = [ 
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  { path: 'signin', component: Login },
  { path: 'signup', component: Signup },
  { path: '**', redirectTo: '' },
];
