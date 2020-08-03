import { Injectable, OnDestroy } from '@angular/core';
import { formatDate } from '@angular/common';
import { timer, Subject, Observable } from 'rxjs';
import { LongRunningTaskApiService } from './long-running-task-api.service';
import { switchMap, retry, share, takeUntil, tap, delay, windowTime, mergeAll } from 'rxjs/operators';
import { ILongRunningTaskDto } from './long-running-task.model';

@Injectable({
  providedIn: 'root',
})
export class LongRunningTaskService implements OnDestroy {

  private readonly StartOffsetInMiliseconds = 250;
  private readonly IntervalBetweenCallsInMiliseconds = 1000;
  private readonly timer$ = timer(this.StartOffsetInMiliseconds, this.IntervalBetweenCallsInMiliseconds);
  private stopPolling = new Subject();
  private startDate: Date = null;

  constructor(private api: LongRunningTaskApiService) { }

  public cancelTask(guid: string): void {
    this.api.postCancelTask(guid).toPromise();
  }

  public resetTask(): void {
    this.stopPolling.next();
    this.api.resetTask();
  }

  public beginCall(
    serviceAction: () => Observable<ILongRunningTaskDto>,
    successCallback: (task: ILongRunningTaskDto) => any,
    onTaskUpdatedAction: (task: ILongRunningTaskDto) => any,
    onFailedAction: (task: ILongRunningTaskDto) => any,
    onConnectionClosedAction: (error: any) => any,
  ): void {
    this.log(`serviceAction task: ????`, 'Request');
    const task$ = serviceAction().pipe(
      tap(t => this.log(`serviceAction task: ${t.guid}`, 'Response')),
      switchMap(task =>
        this.timer$.pipe(
          switchMap(tm => {
            this.log(`getTaskByGuid(${tm}) task: ${task.guid}`, 'Request');
            return this.api.getTaskByGuid(task.guid).pipe(tap(t => this.log(`getTaskByGuid(${tm}) task: ${task.guid}`, 'Response')));
          }),
          retry(),
          share(),
          takeUntil(this.stopPolling),
        )));

    const taskz$ = serviceAction().pipe(
      tap(t => this.log(`serviceAction task: ${t.guid}`)),
      switchMap(task =>
        this.api.getTaskByGuid(task.guid).pipe(
          windowTime(1000),
          tap(t => this.log(`task: ${task.guid}`, 'Request')),
          retry(),
          share(),
          mergeAll(),
          takeUntil(this.stopPolling),
        )));
        
        //windowTime(3000),

    task$.subscribe(t => {
      if (this.successCondition(t)) {
        this.log(`successCallback task: ${t.guid}`, 'Subscription')
        successCallback(t);
        this.stopPolling.next();
      } else if (this.failedCondition(t)) {
        this.log(`failedCondition task: ${t.guid}`, 'Subscription')
        onFailedAction(t);
        this.stopPolling.next();
      } else if (this.cancelledCondition(t)) {
        this.stopPolling.next();
      } else {
        this.log(`onTaskUpdatedAction task: ${t.guid}`, 'Subscription')
        onTaskUpdatedAction(t);
      }
    }, error => {
      onConnectionClosedAction(error);
    });
  }

  private log(message: string, type: string = null) {
    if (this.startDate === null) {
      this.startDate = new Date();
    }
    const logDate = new Date();
    const displayDate = new Date(logDate.getTime() - this.startDate.getTime());
    const prefix = type === null
      ? ''
      : type === 'Request'
        ? '>>>'
        : type === 'Response'
          ? '<<<'
          : type === 'Subscription'
            ? '$$$'
            : '';
    console.log(`[${formatDate(displayDate, 'mm:ss.SSS', 'en')}] ${prefix} LongRunningTaskService: ${message}`);
  }

  private successCondition(t: ILongRunningTaskDto) {
    return t.status === 'Finished';
  }

  private cancelledCondition(t: ILongRunningTaskDto) {
    return t.status === 'Cancelled';
  }

  private failedCondition(t: ILongRunningTaskDto) {
    return t.status === 'Failed';
  }

  public ngOnDestroy() {
    this.stopPolling.next();
  }
}
