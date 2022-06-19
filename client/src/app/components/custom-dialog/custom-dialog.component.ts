import { Component, Inject } from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface CustomDialogData {
  title: string;
  accept?: null;
  accept_text?: string;
  text?: string | null;
  text_label?: string;
  option?: string | null;
  options?: string[];
  options_label?: string;
}

@Component({
  selector: 'app-custom-dialog',
  templateUrl: './custom-dialog.component.html',
  styleUrls: ['./custom-dialog.component.css']
})
export class CustomDialogComponent {
  output: {
    accept?: null;
    text?: string | null;
    option?: string | null;
  } = {}
  constructor(
    public dialogRef: MatDialogRef<CustomDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public input: CustomDialogData,
  ) {
    if (this.input.accept !== undefined) {
      this.output.accept = null;
    }
    if (this.input.text !== undefined) {
      this.output.text = this.input.text;
    }
    if (this.input.options !== undefined) {
      if (this.input.option !== undefined)
        this.output.option = this.input.option;
      else
        this.output.option = this.input.options[0]
    }
  }

  onCloseClick(): void {
    this.dialogRef.close({});
  }

  onOkClick(): void {
    this.dialogRef.close(this.output);
  }
}
