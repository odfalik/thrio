import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.scss']
})
export class SwitchComponent {

  @Input() switch = false;
  @Output() switchChange: EventEmitter<boolean> = new EventEmitter();

  constructor() {

  }

  setVal(newVal: boolean): void {
    this.switch = newVal;
    this.switchChange.emit(this.switch);
  }

}
