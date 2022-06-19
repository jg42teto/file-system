import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Observer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../models/user';
import { Router } from '@angular/router';

const tokenKey = 'auth-token';
const userKey = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private url: string = environment.apiUrl + '/auth'
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  login(email: string, password: string): Observable<void> {
    return new Observable<void>((observer: Observer<void>) => {
      this.http.post<any>(this.url + '/signin', { email, password }).subscribe({
        next: (data) => {
          this.saveToken(data.accessToken);
          this.saveUser(data.user);
          observer.next();
        },
        complete: () => {
          observer.complete();
        },
        error: (err) => {
          console.error(err);
          observer.error(err.error);
        }
      })
    });
  }

  register(email: any, password: any): Observable<void> {
    return new Observable<void>((observer: Observer<void>) => {
      this.http.post(this.url + '/signup', { email, password }).subscribe({
        next: (data) => {
          observer.next();
        },
        complete: () => {
          observer.complete();
        },
        error: (err) => {
          console.error(err);
          observer.error(err.error);
        }
      })
    });
  }

  logout(): void {
    window.sessionStorage.clear();
    this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    return window.sessionStorage.getItem(tokenKey);
  }

  getUser(): User | null {
    const user = window.sessionStorage.getItem(userKey);
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }

  autheticated(): boolean {
    return !!this.getToken();
  }

  private saveToken(token: string): void {
    window.sessionStorage.removeItem(tokenKey);
    window.sessionStorage.setItem(tokenKey, token);
  }

  private saveUser(user: User): void {
    window.sessionStorage.removeItem(userKey);
    window.sessionStorage.setItem(userKey, JSON.stringify(user));
  }

}
