import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthFormComponent } from './components/auth-form/auth-form.component';
import { FileSystemComponent } from './components/file-system/file-system.component';
import { AuthGuard } from './guards/auth.guard';
import { PageNotFoundComponent } from './page-not-found.component';

const routes: Routes = [
  {
    path: 'fs',
    component: FileSystemComponent,
    canActivate: [AuthGuard]
  },
  { path: 'auth', component: AuthFormComponent },
  { path: '404', component: PageNotFoundComponent },
  { path: '', redirectTo: '/fs', pathMatch: 'full' },
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
