import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[app-click-stop-propagation]'
})
export class ClickStopPropagationDirective {
  constructor() { }
  @HostListener("click", ["$event"])
  public onClick(event: any): void {
    event.stopPropagation();
  }
  @HostListener("mousedown", ["$event"])
  public onMouseDown(event: any): void {
    event.stopPropagation();
  }
}
