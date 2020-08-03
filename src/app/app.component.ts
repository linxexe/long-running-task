import { Component } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { LongRunningTaskService } from './long-running-task.service';
import { LongRunningTaskApiService } from './long-running-task-api.service';
import { ILongRunningTaskDto, IProgressInfo } from './long-running-task.model';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  public message = null;
  public sampleTask: ILongRunningTaskDto = {
    guid: 'guid',
    status: 'Pending',
    progressInfo: { isProgressDetermined: true, progressValueInPercentage: 0, description: 'description' },
    creationTime: 'creationTime',
    ebtity: '',
    errorMessage: '',
  };
  public sampleTask$ = new BehaviorSubject<ILongRunningTaskDto>(null);
  public serviceActionCounter = 0;
  public onTaskUpdatedCounter = 0;
  public successActionCounter = 0;
  public onTaskFailedCounter = 0;
  public onConnectionClosedCounter = 0;

  progressStep = "10";
  postTaskDelay = "2000";
  getTaskByGuidDelay = "900";
  postCancelTaskDelay = "5000";

  constructor(private taskService: LongRunningTaskService, private taskApi: LongRunningTaskApiService) {
    this.configure();
  }

  public configure() {
    return this.taskApi.configure(
      parseInt(this.progressStep),
      parseInt(this.postTaskDelay),
      parseInt(this.getTaskByGuidDelay),
      parseInt(this.postCancelTaskDelay)
    );
  }

  public startTask() {
    this.message = 'CREATING TASK';
    this.taskService.beginCall(
      this.serviceAction.bind(this),
      this.successCallback.bind(this),
      this.onTaskUpdatedAction.bind(this),
      this.onFailedAction.bind(this),
      this.onConnectionClosedAction.bind(this),
    );
  }

  public resetTask() {
    this.message = '';
    this.serviceActionCounter = 0;
    this.onTaskUpdatedCounter = 0;
    this.successActionCounter = 0;
    this.onTaskFailedCounter = 0;
    this.onConnectionClosedCounter = 0;
    this.sampleTask$.next(null);
    this.taskService.resetTask();
  }

  public cancelTask() {
    this.message = 'CANCELING TASK';
    this.taskService.cancelTask('guid');
  }

  serviceAction(): Observable<ILongRunningTaskDto> {
    this.serviceActionCounter = this.serviceActionCounter + 1;
    return this.taskApi.postTask();
    // return of(this.sampleTask).pipe(delay(2000), tap(()=> this.message = 'TASK CREATED ON SERVER'));
  };

  successCallback(task: ILongRunningTaskDto) {
    this.successActionCounter = this.successActionCounter + 1;
    this.sampleTask$.next(task);
    this.message = 'TASK COMPLETED';
  }

  onTaskUpdatedAction(task: ILongRunningTaskDto) {
    this.onTaskUpdatedCounter = this.onTaskUpdatedCounter + 1;
    this.sampleTask$.next(task);
    this.message = 'CHECKING TASK STATUS';
  }

  onFailedAction(task: ILongRunningTaskDto) {
    this.onTaskFailedCounter = this.onTaskFailedCounter + 1;
    this.sampleTask$.next(task);
    this.message = 'TASK FAILED';
  }

  onConnectionClosedAction(task: ILongRunningTaskDto) {
    this.onConnectionClosedCounter = this.onConnectionClosedCounter + 1;
    this.sampleTask$.next(task);
    this.message = 'CONNECTION CLOSED';
  }
}
