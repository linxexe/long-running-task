import { Component, Input, ViewChild } from '@angular/core';
import { ILongRunningTaskDto } from './long-running-task.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'longRunningTask',
  template: `
  <div *ngIf="(task$ | async) as task" class="container">
    <h1>Task Id: {{task.guid}}</h1>
    <h2>Status: {{task.status}}</h2>
    <div *ngIf=task.progressInfo>
      <progress style="width: 200px" [value]="task.progressInfo.progressValueInPercentage" max="100"></progress>
      <div style="text-align: center">{{task.progressInfo.progressValueInPercentage}}%</div>
      <button (click)="cancelTask()" style="float: right; margin-top: 5px;">CANCEL</button>
    </div>
  </div>`,
  styles: [`.container {
  display: inline-block;
  border: black;
  border-style: double;
  padding: 10px;
  margin: 10px;
}`]
})
export class LongRunningTaskComponent {
  @Input() task$: any;
  @Input() cancel: Function;

  cancelTask() {
    this.cancel(this.task$.value.guid);
  }
}
