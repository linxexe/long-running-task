import { Injectable, OnDestroy } from '@angular/core';
import { formatDate } from '@angular/common';
import { timer, Subject, BehaviorSubject, Observable, of, interval, throwError } from 'rxjs';
import {
  filter,
  switchMap,
  retry,
  share,
  takeUntil,
  tap,
  delay,
  delayWhen,
  windowTime,
  mergeAll,
  mergeMap,
  repeat,
  withLatestFrom,
  timeInterval,
  catchError,
} from 'rxjs/operators';
import { LongRunningTaskApiService } from './long-running-task-api.service';
import { ILongRunningTaskDto } from './long-running-task.model';

@Injectable({
  providedIn: 'root',
})
export class LongRunningTaskService implements OnDestroy {

  private readonly StartOffsetInMiliseconds = 250;
  private readonly MaxIntervalBetweenCallsInMiliseconds = 1000;
  // private readonly timer$ = timer(this.StartOffsetInMiliseconds, this.IntervalBetweenCallsInMiliseconds);
  private reset$ = new Subject();
  private startDate: Date = null;

  constructor(private api: LongRunningTaskApiService) { }

  public cancelTask(guid: string): void {
    this.api.postCancelTask(guid).toPromise();
  }

  public resetTask(): void {
    this.reset$.next();
    this.api.resetTask();
  }

  private calculateNextInterval(interval: BehaviorSubject<number>, timestamp: number): void {
    const responseTime = Math.round(performance.now() - timestamp);
    const intervalBetweenCallsInMiliseconds = responseTime < this.MaxIntervalBetweenCallsInMiliseconds
     ? this.MaxIntervalBetweenCallsInMiliseconds - responseTime : 1;
    interval.next(intervalBetweenCallsInMiliseconds);
  }

  public beginCall(
    serviceAction: () => Observable<ILongRunningTaskDto>,
    successCallback: (task: ILongRunningTaskDto) => any,
    onTaskUpdatedAction: (task: ILongRunningTaskDto) => any,
    onFailedAction: (task: ILongRunningTaskDto) => any,
    onConnectionClosedAction: (error: any) => any,
  ): void {
    this.log(`serviceAction task: ????`, 'Request');
    
    // Repeat
    const stopPolling = new Subject();
    const interval$ = new BehaviorSubject(1);
    let reuestTimestamp = 0;
    const task$ = serviceAction().pipe(
      tap(task => this.log(`serviceAction task: ${task.guid}`, 'Response')),
      switchMap(task => of({})
        .pipe(
          withLatestFrom(interval$),
          tap(i => this.log(`Start waiting: ${i[1]}`, 'Pause')),
          delayWhen(i => timer(i[1])),
          tap(_ => this.log(`Stop waiting`, 'Pause')),
          tap(_ => this.log(`getTaskByGuid task: ${task.guid}`, 'Request')),
          tap(_ => reuestTimestamp = performance.now()),
          mergeMap(i => this.api.getTaskByGuid(task.guid)
            .pipe(
              tap(_ => this.log(`getTaskByGuid task: ${task.guid}`, 'Response')),
              tap(_ => this.calculateNextInterval(interval$, reuestTimestamp)),
              catchError(e => of({...task, error: e})),
            ),
          ),
          repeat(),
        ),
      ),
      takeUntil(stopPolling),
    );

    const error$ = task$.pipe(filter(t => this.errorCondition(t)));
    const success$ = task$.pipe(filter(t => this.successCondition(t), tap(() => stopPolling.next())));
    const failed$ = task$.pipe(filter(t => this.failedCondition(t), tap(() => stopPolling.next())));
    const cancelled$ = task$.pipe(filter(t => this.cancelledCondition(t), tap(() => stopPolling.next())));
    const update$ = task$.pipe(filter(t => this.updateCondition(t)));

    error$.subscribe(t => onConnectionClosedAction(t.error));
    success$.subscribe(t => successCallback(t));
    failed$.subscribe(t => onFailedAction(t));
    cancelled$.subscribe(t => {});
    update$.subscribe(t => onTaskUpdatedAction(t));

    this.reset$.subscribe(() => stopPolling.next);

    // task$.subscribe(t => {
    //   if (this.errorCondition(t)) {
    //     this.log(`onConnectionClosedAction error: ${JSON.stringify(t.error)}`, 'Subscription')
    //     onConnectionClosedAction(t.error);
    //   } else if (this.successCondition(t)) {
    //     this.log(`successCallback task: ${t.guid}`, 'Subscription')
    //     successCallback(t);
    //     stopPolling.next();
    //   } else if (this.failedCondition(t)) {
    //     this.log(`failedCondition task: ${t.guid}`, 'Subscription')
    //     onFailedAction(t);
    //     stopPolling.next();
    //   } else if (this.cancelledCondition(t)) {
    //     stopPolling.next();
    //   } else {
    //     this.log(`onTaskUpdatedAction task: ${t.guid}`, 'Subscription')
    //     onTaskUpdatedAction(t);
    //   }
    // }, error => {
    //   this.log(`onConnectionClosedAction error: ${JSON.stringify(t.error)}`, 'Subscription')
    //   onConnectionClosedAction(error);
    // });

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
            : type === 'Pause'
              ? '---'
              : '';
    console.log(`[${formatDate(displayDate, 'mm:ss.SSS', 'en')}] ${prefix} LongRunningTaskService: ${message}`);
  }

  private errorCondition(t: ILongRunningTaskDto) {
    return t.error !== null && t.error !== undefined;
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

  private updateCondition(t: ILongRunningTaskDto) {
    return !this.errorCondition(t)
        && !this.successCondition(t)
        && !this.cancelledCondition(t)
        && !this.failedCondition(t);
  }

  public ngOnDestroy() {
    this.reset$.next();
  }
}
