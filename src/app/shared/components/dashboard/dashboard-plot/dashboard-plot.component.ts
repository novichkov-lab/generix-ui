import { ChangeDetectorRef, Component, OnInit, Input } from '@angular/core';
import { PlotService } from '../../../services/plot.service';

@Component({
  selector: 'app-dashboard-plot',
  templateUrl: './dashboard-plot.component.html',
  styleUrls: ['./dashboard-plot.component.css']
})
export class DashboardPlotComponent implements OnInit {

  @Input() id: string;

  data: any;
  layout: any;

  constructor(
    private plotService: PlotService,
    private chRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.id) {
      this.plotService.getReportPlotData(this.id)
        .subscribe((res: any) => {
          const { results } = res;
          this.data = results.data;
          this.layout = results.layout;
          this.layout.height = 600;
          if (this.layout.xaxis) {
            this.layout.xaxis.automargin = true;
          } else {
            this.layout.xaxis = { automargin: true };
          }
          if (this.layout.yaxis) {
            this.layout.yaxis.automargin = true;
          } else {
            this.layout.yaxis = { automargin: true };
          }
          this.chRef.detectChanges();
        });
    }
  }

}
