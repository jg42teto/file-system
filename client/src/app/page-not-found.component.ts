import { Component } from '@angular/core';

@Component({
    template: `
    <h1 
        [style.text-align]="'center'"
        [style.margin]="'2em'"
    >Not Found (404)</h1>
    `
})
export class PageNotFoundComponent { }