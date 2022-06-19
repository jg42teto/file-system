import { Pipe, PipeTransform } from '@angular/core';

const symbols = ['B\u00A0', 'KB', 'MB', 'GB', 'TB']

@Pipe({
  name: 'byteSize'
})
export class ByteSizePipe implements PipeTransform {

  transform(value: number): string {
    let i = 0;
    while (value >= 1024 && i < symbols.length) {
      ++i;
      value /= 1024;
    }
    return Math.ceil(value) + symbols[i];
  }

}
