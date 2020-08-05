import { Component, Input } from '@angular/core';
import { ILongRunningTaskDto } from './long-running-task.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'longRunningTask',
  template: `<div *ngIf="(task$ | async) as task">
    <h1>Task Id: {{task.guid}}</h1>
    <h2>Status: {{task.status}}</h2>
    <progress [value]="task.progressInfo.progressValueInPercentage" max="100"> {{task.progressInfo.progressValueInPercentage}}% </progress>
    <h3 *ngIf=task.progressInfo>Percentage: {{task.progressInfo.progressValueInPercentage}}</h3>
  </div>`,
  styles: [`h1 { font-family: Lato; }`]
})
export class LongRunningTaskComponent  {
  @Input() task$: any;
}
