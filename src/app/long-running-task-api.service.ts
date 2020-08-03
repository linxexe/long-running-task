import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { ILongRunningTaskDto } from './long-running-task.model';

const baseUrl = '/api/long-running-task-service';

@Injectable({
  providedIn: 'root',
})
export class LongRunningTaskApiService {
  readonly defaultTask: ILongRunningTaskDto = {
    guid: 'guid',
    status: 'Pending',
    progressInfo: { isProgressDetermined: true, progressValueInPercentage: 0, description: 'description' },
    creationTime: 'creationTime',
    ebtity: '',
    errorMessage: '',
  };
  task: ILongRunningTaskDto = this.copy<ILongRunningTaskDto>(this.defaultTask);

  progressStep: number = 1;
  postTaskDelay = 0;
  getTaskByGuidDelay = 0;
  postCancelTaskDelay = 0;

  public configure(progressStep: number = 0, postTaskDelay: number = 0, getTaskByGuidDelay: number = 0, postCancelTaskDelay: number = 0): void {
    if (progressStep > 0) { this.progressStep = progressStep; }
    if (postTaskDelay > 0) { this.postTaskDelay = postTaskDelay; }
    if (getTaskByGuidDelay > 0) { this.getTaskByGuidDelay = getTaskByGuidDelay; }
    if (postCancelTaskDelay > 0) { this.postCancelTaskDelay = postCancelTaskDelay; }
  }

  public resetTask() {
    this.task = this.copy(this.defaultTask);
  }

  public postTask(): Observable<ILongRunningTaskDto> {
    this.task = this.copy(this.defaultTask);

    return of(this.task).pipe(delay(this.postTaskDelay));
  }

  public getTaskByGuid(guid: string): Observable<ILongRunningTaskDto> {
    if (this.task.status === 'Pending') {
      this.task.progressInfo.progressValueInPercentage = this.task.progressInfo.progressValueInPercentage + this.progressStep >= 100 
        ? 100
        : this.task.progressInfo.progressValueInPercentage + this.progressStep;
      this.task.progressInfo.progressValueInPercentage = this.task.progressInfo.progressValueInPercentage;
    }
    return of(this.task).pipe(delay(this.getTaskByGuidDelay), tap(() => {
      if(this.task.progressInfo.progressValueInPercentage >= 100) {
      this.task.status = 'Finished';
      }
    }));
  }

  public postCancelTask(guid: string): Observable<void> {
    return of(null).pipe(delay(this.postCancelTaskDelay), tap(() => this.task.status = 'Cancelled'));
  }

  private copy<T>(o: T): T {
    return JSON.parse(JSON.stringify(o));
  }
}
