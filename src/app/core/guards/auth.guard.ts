import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { map } from 'rxjs/operators';
import { from } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  return from(supabase.getSession()).pipe(
    map(session => {
      if (session) {
        return true;
      } else {
        router.navigate(['/signin']);
        return false;
      }
    })
  );
};