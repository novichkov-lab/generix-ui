import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { PlotService } from '../../shared/services/plot.service';
import { ObjectMetadata, DimensionContext } from '../../shared/models/object-metadata';
import { QueryBuilderService } from '../../shared/services/query-builder.service';
import { PlotlyConfig, AxisBlock } from 'src/app/shared/models/plotly-config';
import { MapBuilder } from 'src/app/shared/models/map-builder';
import { PlotlyBuilder, AxisOption, Axis, Constraint } from 'src/app/shared/models/plotly-builder';
import { Response } from 'src/app/shared/models/response';
import { PlotValidatorService as validator } from 'src/app/shared/services/plot-validator.service';
@Component({
  selector: 'app-plot-options',
  templateUrl: './plot-options.component.html',
  styleUrls: ['./plot-options.component.css'],
})
export class PlotOptionsComponent implements OnInit {

  public metadata: ObjectMetadata;
  public allPlotTypeData: PlotlyConfig[];
  public plotTypeData: PlotlyConfig[]; // plotTypeData displayed depending on dimensionality
  public selectedPlotType: PlotlyConfig;
  public objectId: string;
  public coreTypePlot = false;
  public numberOfAxes = 2; // currently just for core types
  private coreTypeName: string;
  public isMap = false; // determines if we should use UI for map config
  public mapBuilder: MapBuilder;
  public axisOptions: AxisOption[]; // user facing options that displays options based on what can be plotted
  private _axisOptions: AxisOption[]; // stores all axis options regardless of if theyre allowed to be displayed
  public plot: PlotlyBuilder;
  public needsConstraints = false;
  public unableToPlot = false;
  constrainableDimensions: DimensionContext[];
  public invalid = false;

  constructor(
    private route: ActivatedRoute,
    private plotService: PlotService,
    private queryBuilder: QueryBuilderService,
    private router: Router,
    ) { }

  ngOnInit() {

    // get object id
    this.route.params.subscribe(params => {
        if (params['id']) {
          this.objectId = params.id;
          this.plot = this.plotService.getPlotlyBuilder();
          this.plot.object_id = params.id;
        }
    });

    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['coreType']) {
        this.coreTypePlot = true;
        this.coreTypeName = queryParams['coreType'];
        const query = JSON.parse(localStorage.getItem('coreTypePlotParams'));
        this.plot = this.plotService.getPlotlyBuilder(true, query);
        this.plot.title = this.coreTypeName;
      }
    });

    this.mapBuilder = JSON.parse(localStorage.getItem('mapBuilder'));
    if (this.mapBuilder) {
      this.isMap = true;
    }

    if (this.coreTypePlot) {
      this.queryBuilder.getCoreTypeProps(this.coreTypeName)
        .subscribe((data: Response<AxisOption>) => {
          this.axisOptions = data.results;
          this._axisOptions = [...this.axisOptions];
          this.getPlotTypes();
        });
    } else {
      // get metadata and assign to AxisOption type 
      // TODO: needs to be formatted like this on the backend
      this.queryBuilder.getObjectMetadata(this.objectId)
        .subscribe((result: any) => {
        this.metadata = result; ///
        this.plot.title = this.metadata.data_type.oterm_name + ` (${this.objectId})`;
        this.axisOptions = [];
        // this.setConstrainableDimensions();
        if (!validator.validPlot(this.plot)) {
          this.setConstrainableDimensions();
        }
        result.dim_context.forEach((dim, i) => {
          dim.typed_values.forEach((dimVar, j) => {
            this.axisOptions.push({
              scalar_type: dimVar.values.scalar_type,
              name: dimVar.value_no_units,
              display_name: dimVar.value_with_units,
              term_id: dimVar.value_type.oterm_ref,
              dimension: i,
              dimension_variable: j
            });
          });
        });
        result.typed_values.forEach((dataVar, i) => {
          this.axisOptions.push({
            scalar_type: dataVar.values.scalar_type,
            name: dataVar.value_no_units,
            display_name: dataVar.value_with_units,
            term_id: dataVar.value_type.oterm_ref,
            data_variable: i
          });
        });
        this._axisOptions = [...this.axisOptions];
        this.getPlotTypes();
      });
    }
  }

  getPlotTypes() {
    // TODO: add map types but figure out a way to only show it if theres lat and long
    this.plotService.getPlotTypes()
      .subscribe((data: Response<PlotlyConfig>) => {

        // add map option to plots if the variables include lat and long
        const includeMap = this.axisOptions.filter(option => {
          return option.name === 'latitude' || option.name === 'longitude'
        }).length === 2;

        if (!this.coreTypePlot) {
          this.plotTypeData = this.validateAxes(data.results, includeMap);
        } else {
          this.plotTypeData = includeMap
            ? data.results
            : data.results.filter(result => !result.map);
        }
        // this should never be true for core types
        if (this.plotTypeData.length === 0) {
          this.unableToPlot = true;
        }

        if (this.isMap) {
          this.plot.plot_type = this.plotTypeData[this.plotTypeData.length - 1];
        }
    });
  }

  validateAxes(plotTypes: PlotlyConfig[], includeMap = false) {
    // determine number of properties with numeric scalar in data to be plotted
      const totalLength = this.axisOptions.length;
      // number of variables that are numeric
      const totalNumericLength = this.axisOptions.reduce<number>((acc: number, axisOption: AxisOption) => {
        if ((this.isNumeric(axisOption.scalar_type))) { return acc + 1; }
        return acc;
      }, 0);
      return plotTypes.filter(plotType => {
        if (plotType.n_dimensions > totalLength) return false;
        if (!includeMap && plotType.map) return false;
        
        // number of plot axes that are required to be numeric
        const totalNumericAxes = Object.entries(plotType.axis_data).reduce<number>((acc: number, [_, val]) => {
            if (val.numeric_only) { return acc + 1 }
            return acc;
        }, 0);
        if (totalNumericAxes > totalNumericLength) {
          return false;
        }
        return true;
      });
  }

  isNumeric(scalar) {
    return scalar === 'int' || scalar === 'date' || scalar === 'float'
  }

  updatePlotType(event: PlotlyConfig) {
    this.invalid = false; // dont mark all the other forms invalid before anyone tried to fill them out
    this.isMap = false;
    this.plot.plot_type = event;
    if (event.map) {
      this.isMap = true;
      this.mapBuilder = new MapBuilder(this.coreTypePlot);
      if (this.coreTypePlot) {
        this.mapBuilder.query = this.plot.query;
      } else {
        this.mapBuilder.brickId = this.objectId;
      }
    } else {
      delete this.mapBuilder;
      localStorage.removeItem('mapBuilder');
    }
    if (event.axis_data.z) {
      this.plot.axes.z = new Axis();
    } else {
      delete this.plot.axes.z;
    }
    if (!this.coreTypePlot) {
      this.plot.setDimensionConstraints(this.constrainableDimensions);
    }
  }

  handleSelectedAxis(event: AxisOption) {
    if (this.coreTypePlot) {
      this.axisOptions = [...this.axisOptions.filter(option => option.term_id !== event.term_id)];
    } else {
      this.axisOptions = [...this.axisOptions.filter(option => {
        if (validator.hasOneRemainingAxis(this.plot) && !validator.hasDataVarsInPlot(this.plot)) {
          return option.data_variable !== event.data_variable && option.dimension === undefined;
        }
        return option.dimension !== event.dimension || option.data_variable !== event.data_variable;
      })];
      this.setConstrainableDimensions();
    }
  }

  handleSelectionCleared() {
    if (this.coreTypePlot) {
      this.axisOptions = [
        ...this._axisOptions.filter((option) => {
          for (const [_, val] of Object.entries(this.plot.axes)) {
            if (val.data?.term_id === option.term_id) {
              return false;
            }
          }
          return true;
        })
      ]
    } else {
      this.axisOptions = [
        ...this._axisOptions.filter((option) => {
          for (const [_, val] of Object.entries(this.plot.axes)) {
            if (validator.hasOneRemainingAxis(this.plot) && option.dimension !== undefined) {
              // only show data variables if theres one axis left and no data vars have been chosen yet
              return validator.hasDataVarsInPlot(this.plot);
            }
            if (val.data_var_idx !== undefined && val.data_var_idx === option.dimension_variable) { return false; }
            if (val.dim_idx !== undefined && val.dim_idx === option.dimension) { return false; }
          }
          return true;
        })
      ];
      this.setConstrainableDimensions();
    }
  }

  setConstrainableDimensions() {
    // whichever dimensions arent selected are all displayed as constrainable items
    this.constrainableDimensions = [
      ...this.metadata.dim_context.filter((dim, idx) => {
        return this.plot.axes.x.dim_idx !== idx &&
        this.plot.axes.y.dim_idx !== idx &&
        this.plot.axes.z?.dim_idx !== idx;
      })
    ];
    this.plot.setDimensionConstraints(this.constrainableDimensions, this.metadata);
  }

  submitPlot() {

    if (this.isMap) {
      localStorage.setItem('mapBuilder', JSON.stringify(this.mapBuilder));
      this.router.navigate(['/plot/map/result']);
      return;
    }

    if (!validator.validPlot(this.plot)) {
      this.invalid = true;
      return;
    }

    localStorage.setItem('plotlyBuilder', JSON.stringify(this.plot));
    if (this.coreTypePlot) {
      this.router.navigate(['/plot/result'], {queryParams: {
        coreType: this.coreTypeName
      }});
    } else {
        this.router.navigate([`plot/result/${this.objectId}`]);
    } 
  }

  onGoBack(id) {
    if (!this.coreTypePlot) {
      this.router.navigate([`/search/result/brick/${id}`]);
    } else {
      this.router.navigate(['/search/result']); // TODO: make sure localStorage works with queries from plotly builder
    }
  }

}
