import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
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
  tasks: ILongRunningTaskDto[] = [];

  progressStep: number = 1;
  postTaskDelay = 0;
  getTaskByGuidDelay = 0;
  postCancelTaskDelay = 0;
  shouldThrowError = false;

  public configure(progressStep: number = 0, postTaskDelay: number = 0, getTaskByGuidDelay: number = 0, postCancelTaskDelay: number = 0): void {
    if (progressStep > 0) { this.progressStep = progressStep; }
    if (postTaskDelay > 0) { this.postTaskDelay = postTaskDelay; }
    if (getTaskByGuidDelay > 0) { this.getTaskByGuidDelay = getTaskByGuidDelay; }
    if (postCancelTaskDelay > 0) { this.postCancelTaskDelay = postCancelTaskDelay; }
  }

  public resetTask() {
    this.tasks = [];
  }

  public throw() {
    this.shouldThrowError = true;
  }

  public postTask(): Observable<ILongRunningTaskDto> {
    const task = this.copy(this.defaultTask);
    task.guid = Math.floor(Math.random()*999).toString();
    this.tasks.push(task);

    return of(task).pipe(delay(this.postTaskDelay));
  }

  public getTaskByGuid(guid: string): Observable<ILongRunningTaskDto> {
    const task = this.tasks.find(t => t.guid === guid);
    if (task.status === 'Pending') {
      task.progressInfo.progressValueInPercentage = task.progressInfo.progressValueInPercentage + this.progressStep >= 100 
        ? 100
        : task.progressInfo.progressValueInPercentage + this.progressStep;
      task.progressInfo.progressValueInPercentage = task.progressInfo.progressValueInPercentage;
    }

    if(this.shouldThrowError) {
      this.shouldThrowError = false;
      return throwError({ httpStatusCode: 500, message: '200 OK ;)'})
    }

    return of(this.copy(task)).pipe(delay(this.getTaskByGuidDelay), tap(() => {
      if(task.progressInfo.progressValueInPercentage >= 100) {
        task.status = 'Finished';
      }
    }));
  }

  public postCancelTask(guid: string): Observable<void> {
    const task = this.tasks.find(t => t.guid === guid);

    return of(null).pipe(delay(this.postCancelTaskDelay), tap(() => task.status = 'Cancelled'));
  }

  private copy<T>(o: T): T {
    return JSON.parse(JSON.stringify(o));
  }
}
