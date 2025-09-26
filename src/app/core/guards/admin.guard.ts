import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  return from(supabase.client.auth.getSession()).pipe(
    switchMap(({ data: { session } }) => {
      if (!session) {
        router.navigate(['/admin/login']);
        return [false];
      }
      return from(supabase.getMyProfile()).pipe(
        map(profile => {
          if (!profile) {
            router.navigate(['/admin/login']);
            return false;
          }
          if (profile.is_admin) {
            return true;
          } else {
            router.navigate(['/']);
            return false;
          }
        }),
        catchError(() => {
          router.navigate(['/admin/login']);
          return of(false);
        })
      );
    })
  );
};
