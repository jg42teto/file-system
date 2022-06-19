import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse } from '@angular/common/http'
import { Observable, Observer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Disk } from '../models/disk';
import { FileObject, FileSystemObject, Folder, FolderContent } from '../models/file-system-object';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class FileSystemService {
  constructor(private http: HttpClient) { }

  private url(db: string, rest: string): string {
    return environment.apiUrl + '/fs/' + db + rest;
  }

  fetchDisks(): Observable<Disk> {
    return new Observable((observer: Observer<Disk>) => {
      let dbsLeft = environment.dbs.length;
      let errs: any[] = [];
      environment.dbs.forEach((db: string) => {
        this.http.get<any[]>(this.url(db, '/disks'))
          .subscribe({
            next: (disks) => {
              disks.forEach(disk => observer.next({ ...disk, db } as Disk))
            },
            error: (err) => {
              errs.push(err);
              console.error(err);
              if (--dbsLeft === 0) {
                observer.error(errs);
              }
            },
            complete: () => {
              if (--dbsLeft === 0) {
                observer.complete();
              }
            }
          })
      })
    })
  }

  fetchDiskTopLevelContent(disk: Disk): Observable<FolderContent> {
    return this.http.get<FolderContent>(this.url(disk.db, `/disks/${disk.id}`));
  }

  fetchDeletedContent(disk: Disk): Observable<FolderContent> {
    return this.http.get<FolderContent>(this.url(disk.db, `/disks/${disk.id}/deleted`));
  }

  fetchFolderContent(disk: Disk, folder: Folder): Observable<FolderContent> {
    return this.http.get<FolderContent>(this.url(disk.db, `/folders/${folder.id}`));
  }

  newDisk(db: string, data: Partial<Disk>): Observable<Disk | null> {
    return new Observable<Disk | null>((observer: Observer<Disk | null>) => {
      this.http.post<Disk | null>(this.url(db, `/disks`), data).subscribe({
        next: (disk) => {
          if (disk) {
            disk.db = db
          }
          observer.next(disk);
        },
        error: (err) => {
          console.error(err);
          observer.error(err);
        },
        complete: () => {
          observer.complete();
        }
      })
    })
  }

  renameDisk(disk: Disk, new_name: string): Observable<boolean> {
    return new Observable<boolean>((observer: Observer<boolean>) => {
      this.http.patch<any>(this.url(disk.db, `/disks/${disk.id}/rename`), { new_name })
        .subscribe({
          next: (data) => {
            observer.next(data.renamed);
          },
          error: (err) => {
            console.error(err);
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          }
        });
    })
  }

  deleteDisk(disk: Disk): Observable<boolean> {
    return new Observable<boolean>((observer: Observer<boolean>) => {
      this.http.delete<any>(this.url(disk.db, `/disks/${disk.id}`))
        .subscribe({
          next: (data) => {
            observer.next(data.deleted);
          },
          error: (err) => {
            console.error(err);
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          }
        });
    })
  }

  moveFso(disk: Disk, fso: FileSystemObject, new_parent?: Folder): Observable<boolean> {
    return new Observable<boolean>((observer: Observer<boolean>) => {
      this.http.patch<any>(this.url(disk.db, `/fsos/${fso.id}/move`), { new_parent_id: new_parent?.id || null })
        .subscribe({
          next: (data) => {
            observer.next(data.moved);
          },
          error: (err) => {
            console.error(err);
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          }
        });
    })
  }

  renameFso(disk: Disk, fso: FileSystemObject, new_name: string): Observable<boolean> {
    return new Observable<boolean>((observer: Observer<boolean>) => {
      this.http.patch<any>(this.url(disk.db, `/fsos/${fso.id}/rename`), { new_name })
        .subscribe({
          next: (data) => {
            observer.next(data.renamed);
          },
          error: (err) => {
            console.error(err);
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          }
        });
    })
  }

  deleteFso(disk: Disk, fso: FileSystemObject): Observable<boolean> {
    return new Observable<boolean>((observer: Observer<boolean>) => {
      this.http.delete<any>(this.url(disk.db, `/fsos/${fso.id}`))
        .subscribe({
          next: (data) => {
            observer.next(data.deleted);
          },
          error: (err) => {
            console.error(err);
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          }
        });
    })
  }

  recoverFso(disk: Disk, fso: FileSystemObject): Observable<boolean> {
    return new Observable<boolean>((observer: Observer<boolean>) => {
      this.http.patch<any>(this.url(disk.db, `/fsos/${fso.id}/recover`), {})
        .subscribe({
          next: (data) => {
            observer.next(data.recovered);
          },
          error: (err) => {
            console.error(err);
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          }
        });
    })
  }

  newFolder(disk: Disk, parentFolder: Folder | null, data: Partial<Folder>): Observable<Folder | null> {
    let path = !!parentFolder
      ? `/folders/${parentFolder.id}/folders`
      : `/disks/${disk.id}/folders`;
    return this.http.post<Folder | null>(
      this.url(disk.db, path),
      data
    );
  }

  newFile(disk: Disk, parentFolder: Folder | null, file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    let path = !!parentFolder
      ? `/folders/${parentFolder.id}/files`
      : `/disks/${disk.id}/files`;
    const req = new HttpRequest(
      'POST',
      this.url(disk.db, path),
      formData, {
      reportProgress: true,
      responseType: 'json'
    });
    return this.http.request(req);
  }

  // error handling only
  downloadFile(disk: Disk, file: FileObject): Observable<void> {
    return new Observable<void>((observer: Observer<void>) => {
      this.http.get(
        this.url(disk.db, `/files/${file.id}/download`),
        { responseType: 'blob', observe: 'response' })
        .subscribe({
          next: (data: HttpResponse<Blob>) => {
            if (data.body)
              saveAs(data.body, this.parseFilename(data))
            observer.next();
          },
          complete: () => {
            observer.complete();
          },
          error: async (err) => {
            console.error(err);
            observer.error(JSON.parse(await err.error.text()).message);
          }
        })
    })
  }

  private parseFilename(data: HttpResponse<Blob>): string | undefined {
    let contentDisposition = data.headers.get('Content-Disposition');
    if (!contentDisposition) return undefined;
    let regex = /^attachment;\s*filename=\"(.+)\"$/g;
    let result = regex.exec(contentDisposition);
    return result && result[1] || undefined;
  }

}