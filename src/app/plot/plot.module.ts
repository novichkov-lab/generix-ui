import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlotComponent } from './plot.component';
import { PlotRoutingModule } from './plot-routing.module';
import { PlotOptionsComponent } from './plot-options/plot-options.component';
import { DimensionOptionsComponent } from './plot-options/dimension-options/dimension-options.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AxisLabelerComponent } from './plot-options/dimension-options/axis-labeler/axis-labeler.component';
import { PlotResultComponent } from './plot-result/plot-result.component';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import { QueryBuilderService } from '../shared/services/query-builder.service';
import { PlotService } from '../shared/services/plot.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SafeHtmlPipe } from 'src/app/shared/pipes/safe-html.pipe';
import { NgSelectModule } from '@ng-select/ng-select';

PlotlyModule.plotlyjs = PlotlyJS;
@NgModule({
  declarations: [SafeHtmlPipe, PlotComponent, PlotOptionsComponent, DimensionOptionsComponent, AxisLabelerComponent, PlotResultComponent],
  imports: [
    CommonModule,
    PlotRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    PlotlyModule,
    NgxSpinnerModule,
    NgSelectModule
  ],
  providers: [PlotService, QueryBuilderService]
})
export class PlotModule { }
