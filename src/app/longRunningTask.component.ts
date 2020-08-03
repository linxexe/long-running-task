import { Component, Input } from '@angular/core';
import { ILongRunningTaskDto } from './long-running-task.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'longRunningTask',
  template: `<div *ngIf="(task$ | async) as task">
    <h1>Status: {{task.status}}</h1>
    <h1 *ngIf=task.progressInfo>Percentage: {{task.progressInfo.progressValueInPercentage}}</h1>
  </div>`,
  styles: [`h1 { font-family: Lato; }`]
})
export class LongRunningTaskComponent  {
  @Input() task$: any;
}
