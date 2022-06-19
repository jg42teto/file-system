import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-auth-form',
  templateUrl: './auth-form.component.html',
  styleUrls: ['./auth-form.component.css']
})
export class AuthFormComponent implements OnInit, OnDestroy {

  form = this.buildForm();
  isMobile = false;

  private subscriptions: Subscription[] = [];
  constructor(
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this.breakpointObserver.observe("(max-width: 599px)")
      .subscribe(result => this.isMobile = result.matches));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  login(): void {
    if (this.form?.invalid) {
      this.form?.markAllAsTouched();
      return;
    }
    this.authService.login(this.form?.get('email')?.value, this.form?.get('password')?.value).subscribe({
      next: () => {
        this.router.navigate(['/fs']);
      },
      error: (err) => {
        alert(err.message)
      }
    });
  }

  register(): void {
    if (this.form?.invalid) {
      this.form?.markAllAsTouched();
      return;
    }
    this.authService.register(this.form?.get('email')?.value, this.form?.get('password')?.value).subscribe({
      next: () => {
        this.form = this.buildForm();
        alert("Please, login");
      },
      error: (err) => {
        alert(err.message);
      }
    });

  }

  resetValue(fieldControlName: string): void {
    this.form?.get(fieldControlName)?.reset(null);
  }

  private buildForm(): FormGroup {
    return this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]]
    });
  }
}
