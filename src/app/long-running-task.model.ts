export interface ILongRunningTaskDto {
  guid: string;
  status: string;
  progressInfo: IProgressInfo;
  creationTime: string;
  ebtity: any;
  errorMessage: string;
}

export interface IProgressInfo {
  isProgressDetermined: boolean;
  progressValueInPercentage: number;
  description: string;
}
