import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Disk } from 'src/app/models/disk';
import { FileObject, FileSystemObject, Folder, FolderContent } from 'src/app/models/file-system-object';
import { FileSystemService } from 'src/app/services/file-system.service';
import { environment } from 'src/environments/environment';
import { CustomDialogComponent } from '../custom-dialog/custom-dialog.component';
import { UploadDialogComponent } from '../upload-dialog/upload-dialog.component';

@Component({
  selector: 'app-file-system',
  templateUrl: './file-system.component.html',
  styleUrls: ['./file-system.component.scss'],
})
export class FileSystemComponent implements OnInit, OnDestroy {
  disks: Disk[] = [];
  activeDisk?: Disk;
  activeTrashed: boolean = false;
  activeFolder?: Folder;
  activeFolderContent?: FolderContent;
  folderHistory: Folder[] = [];
  clipboardObject?: FileSystemObject;
  clipboardObjectDisk?: Disk;

  constructor(
    private fs: FileSystemService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.fs.fetchDisks()
      .subscribe((disk) => this.disks.push(disk));
  }

  ngOnDestroy(): void {
    this.snackBar.dismiss();
  }

  private snack(message: string) {
    this.snackBar.open(message, '', { duration: 3000 });
  }

  private resetContent(): void {
    this.activeFolder = undefined;
    this.folderHistory = [];
    this.activeFolderContent = undefined;
  }

  diskChange(change: MatSelectionListChange) {
    this.activeDisk = change.source.selectedOptions.selected[0].value;
    this.diskAction();
  }

  diskAction() {
    if (!this.activeDisk) return;
    this.activeTrashed = false;
    this.resetContent();
    this.fs.fetchDiskTopLevelContent(this.activeDisk)
      .subscribe(fc => this.activeFolderContent = fc);
  }

  thrashedAction() {
    if (!this.activeDisk) return;
    this.activeTrashed = true;
    this.resetContent();
    this.fs.fetchDeletedContent(this.activeDisk)
      .subscribe(fc => {
        this.activeFolderContent = fc
      });
  }

  fileObjectAction(fso: FileSystemObject) {
    if (fso.kind === 'fold') {
      this.folderAction(fso as Folder)
    }
    else if (fso.kind === 'file') {
      this.fileDownload(fso as FileObject);
    }
  }

  folderAction(folder: Folder) {
    if (!this.activeDisk || this.activeTrashed) return;

    this.activeFolder = folder;
    let i = this.folderHistory.indexOf(folder);
    if (i == -1) {
      this.folderHistory.push(folder);
    }
    else {
      this.folderHistory.splice(i + 1);
    }
    this.activeFolderContent = undefined;
    this.fs.fetchFolderContent(this.activeDisk, this.activeFolder)
      .subscribe(fc => {
        this.activeFolderContent = fc;
      });
  }

  objectMove(fso: FileSystemObject) {
    this.clipboardObject = fso;
    this.clipboardObjectDisk = this.activeDisk;
  }

  objectPaste() {
    if (!(this.clipboardObject && this.activeDisk)) return;

    if (this.clipboardObjectDisk != this.activeDisk) {
      this.snack("Can't move outside the origin disk.");
      return;
    }

    let afc = this.activeFolderContent;
    this.fs.moveFso(this.activeDisk, this.clipboardObject, this.activeFolder)
      .subscribe(moved => {
        if (!moved) {
          return;
        }

        if (afc && this.clipboardObject) {
          FolderContent.add(afc, this.clipboardObject)
        }

        this.clipboardObject = undefined;
        this.clipboardObjectDisk = undefined;
      })
  }

  closeClipboard() {
    this.clipboardObject = undefined;
  }

  objectDelete(fso: FileSystemObject) {
    if (!this.activeDisk) return;

    let afc = this.activeFolderContent;
    this.fs.deleteFso(this.activeDisk, fso)
      .subscribe(deleted => {
        if (deleted && afc)
          FolderContent.remove(afc, fso);
      })
  }

  objectRecover(fso: FileSystemObject) {
    if (!this.activeDisk) return;

    let afc = this.activeFolderContent;
    this.fs.recoverFso(this.activeDisk, fso)
      .subscribe(recovered => {
        if (recovered && afc)
          FolderContent.remove(afc, fso);
      })
  }

  objectRename(fso: FileSystemObject) {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      data: {
        title: "Edit Name",
        text: fso.name,
        text_label: "New name"
      },
    });

    dialogRef.beforeClosed().subscribe(({ text }) => {
      if (text !== undefined && this.activeDisk)
        this.fs.renameFso(this.activeDisk, fso, text)
          .subscribe(renamed => {
            if (!renamed) return;
            fso.name = text;
          });
    });

  }

  fileUpload() {
    if (!this.activeDisk) return;

    const dialogRef = this.dialog.open(UploadDialogComponent, {
      data: {
        disk: this.activeDisk,
        parentFolder: this.activeFolder
      },
    });

    dialogRef.beforeClosed().subscribe(file => {
      if (file && this.activeFolderContent) {
        FolderContent.add(this.activeFolderContent, file);
      }
    })

  }

  fileDownload(file: FileObject) {
    if (!this.activeDisk) return;
    this.fs.downloadFile(this.activeDisk, file).subscribe({
      error: (err) => {
        this.snack(err);
      }
    });
  }

  folderNew() {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      data: {
        title: "New Folder",
        text: "New folder",
        text_label: "Name"
      },
    });

    dialogRef.beforeClosed().subscribe(({ text }) => {
      if (text !== undefined && this.activeDisk) {
        let afc = this.activeFolderContent;
        this.fs.newFolder(this.activeDisk, this.activeFolder || null, { name: text })
          .subscribe(folder => {
            if (folder && afc)
              FolderContent.add(afc, folder);
          });
      }
    });
  }

  diskRename() {
    if (!this.activeDisk) return;

    const dialogRef = this.dialog.open(CustomDialogComponent, {
      data: {
        title: "Edit Name",
        text: this.activeDisk.name,
        text_label: "New name"
      },
    });

    let disk = this.activeDisk;
    dialogRef.beforeClosed().subscribe(({ text }) => {
      if (text !== undefined && this.activeDisk)
        this.fs.renameDisk(this.activeDisk, text)
          .subscribe(renamed => {
            if (!renamed) return;
            disk.name = text;
          });
    });

  }

  diskDelete() {
    if (!this.activeDisk) return;
    let diskToDelete = this.activeDisk;

    const dialogRef = this.dialog.open(CustomDialogComponent, {
      data: {
        title: "Delete Disk",
        accept: null,
        accept_text: `Do you want to permanently delete disk '${this.activeDisk.name}' and all of its content?`
      },
    });

    dialogRef.beforeClosed().subscribe(({ accept }) => {
      if (accept !== undefined) {
        this.fs.deleteDisk(diskToDelete)
          .subscribe(deleted => {
            if (deleted) {
              this.disks = this.disks.filter(d => d !== diskToDelete);
              if (this.activeDisk && this.activeDisk === diskToDelete) {
                this.activeDisk = undefined;
                this.resetContent();
              }
            }
          })
      }
    })
  }

  diskNew() {
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      data: {
        title: "New Disk",
        text: "New disk",
        text_label: "Name",
        option: environment.dbs[0],
        options: environment.dbs,
        options_label: "Choose Db"
      },
    });

    dialogRef.beforeClosed().subscribe(({ text, option }) => {
      if (text !== undefined && option !== undefined) {
        this.fs.newDisk(option, { name: text })
          .subscribe(disk => {
            if (disk)
              this.disks.push(disk);
          });
      }
    });
  }

}
