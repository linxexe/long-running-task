import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { LongRunningTaskComponent } from './longRunningTask.component';
import { LongRunningTaskService } from './long-running-task.service';
import { LongRunningTaskApiService } from './long-running-task-api.service';

@NgModule({
  imports:      [ BrowserModule, FormsModule ],
  providers:    [ LongRunningTaskService, LongRunningTaskApiService ],
  declarations: [ AppComponent, LongRunningTaskComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
