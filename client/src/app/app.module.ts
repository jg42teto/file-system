import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button'
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'

import { NgxMatFileInputModule } from '@angular-material-components/file-input';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FileSystemComponent } from './components/file-system/file-system.component';
import { AuthFormComponent } from './components/auth-form/auth-form.component';
import { CustomDialogComponent } from './components/custom-dialog/custom-dialog.component';
import { UploadDialogComponent } from './components/upload-dialog/upload-dialog.component';
import { PageNotFoundComponent } from './page-not-found.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ClickStopPropagationDirective } from './directives/click-stop-propagation.directive';
import { LayoutComponent } from './components/layout/layout.component';
import { ByteSizePipe } from './pipes/byte-size.pipe';

@NgModule({
  declarations: [
    AppComponent,
    FileSystemComponent,
    ClickStopPropagationDirective,
    CustomDialogComponent,
    AuthFormComponent,
    PageNotFoundComponent,
    UploadDialogComponent,
    LayoutComponent,
    ByteSizePipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatSliderModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatExpansionModule,
    MatCardModule,
    MatRadioModule,
    MatListModule,
    ScrollingModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatDialogModule,
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule,
    NgxMatFileInputModule,
    MatSidenavModule,
    MatTabsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
