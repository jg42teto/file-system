import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Disk } from 'src/app/models/disk';
import { Folder } from 'src/app/models/file-system-object';
import { FileSystemService } from 'src/app/services/file-system.service';

export interface UploadDialogInput {
  disk: Disk;
  parentFolder?: Folder;
}

fileControl: FormControl;

@Component({
  selector: 'app-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.css']
})
export class UploadDialogComponent implements OnInit, OnDestroy {
  fileControl: FormControl;
  currentFile?: File;
  progress?: number;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public input: UploadDialogInput,
    private fs: FileSystemService,
    private dialogRef: MatDialogRef<UploadDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.fileControl = new FormControl();
  }


  ngOnInit(): void {
    this.fileControl.valueChanges.subscribe((files: any) => {
      if (!files) {
        this.snack("Something went wrong with the file selection process.");
        return;
      }

      if (files.length != 1) {
        this.fileControl.reset();
        this.snack("One file at the time can be uploaded.");
        return;
      }

      this.currentFile = files[0];
    })
  }

  ngOnDestroy(): void {
    this.snackBar.dismiss();
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }

  onOkClick(): void {
    if (!this.currentFile) {
      return;
    }

    this.progress = 0;
    this.fs.newFile(this.input.disk, this.input.parentFolder || null, this.currentFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          let fileObject = event.body as (File | null);
          this.dialogRef.close(fileObject);
        }
      },
      error: (err: any) => {
        this.progress = 0;
        if (err.error && err.error.message) {
          this.snack(err.error.message);
        } else {
          this.snack('Could not upload the file, try again later.');
        }
        this.currentFile = undefined;
        this.progress = undefined;
      }
    });
  }

  private snack(message: string) {
    this.snackBar.open(message, '', { duration: 3000 });
  }

}
