import { Injectable, OnChanges } from '@angular/core';
import { NetworkService } from './network.service';
import { PlotBuilder, Dimension, Config } from '../models/plot-builder';
import { DataQuery } from '../models/data-query';
import { FormGroup, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { DimensionRef } from 'src/app/shared/models/plot-builder';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class PlotService {

  public plotBuilder: PlotBuilder = new PlotBuilder();
  public plotType: string;
  public axisLabelBuilders: any = {};
  private axisLabelSub = new Subject();

  constructor(private http: HttpClient) {
    const cachedPlotBuilder = this.getPlotCache();
    this.plotBuilder = cachedPlotBuilder ? cachedPlotBuilder : new PlotBuilder();
  }

  getPlotBuilder() {
    return this.plotBuilder;
  }

  getPlotType() {
    // return this.plotType;
    return localStorage.getItem('plotType');
  }

  setPlotType(value) {
    // this.plotType = value;
    localStorage.setItem('plotType', value);
  }

  setPlotCache() {
    localStorage.setItem('plotBuilder', JSON.stringify(this.plotBuilder));
  }

  getPlotCache() {
    return JSON.parse(localStorage.getItem('plotBuilder'));
  }

  getConfiguredDimensions() {
    const keys = Object.keys(this.plotBuilder.config);
    // return all refenences to dimensions without adding config.title
    return keys.map(v => this.plotBuilder.config[v]).filter(t => typeof t !== 'string');
  }

  getDimDropdownValue(axis) {
    return this.plotBuilder.data[axis].toString();
  }

  setConfig(
    title: string,
    length: number,
    callback: (dims: Dimension[]) => void
    ) {
    const { config } = this.plotBuilder;
    config.title = title + ` (${this.plotBuilder.objectId})`;
    config.x = new Dimension();
    config.y = new Dimension();
    if (length > 1) {
      config.z = new Dimension();
      this.plotBuilder.data.z = '' as any;
      callback([config.x, config.y, config.z]); // add 3 dimensions to form
    } else {
      callback([config.x, config.y]); // add 2 dimensions to form
    }
    this.setPlotCache();
  }

  /// axis label methods ///

  setLabelBuilder(labelBuilder: DimensionRef, axis: string) {
    this.axisLabelBuilders[axis] = labelBuilder;
    this.axisLabelSub.next({axis, labelBuilder: this.axisLabelBuilders[axis]});
  }

  getLabelBuilder(axis) {
    return this.axisLabelBuilders[axis];
  }

  getUpdatedLabelBuilder() {
    return this.axisLabelSub.asObservable();
  }

  updateFormatString(format: string, axis: string) {
    this.plotBuilder.config[axis].label_pattern = format;
  }

  clearPlotBuilder() {
    // delete this.plotType;
    localStorage.removeItem('plotType');
    localStorage.removeItem('plotBuilder');
    this.axisLabelBuilders = {};
    this.plotBuilder = new PlotBuilder();
  }

  setPlotlyDataAxis(key: string, value: string) {
    this.plotBuilder.data[key] = value;
  }

  getPlotlyData() {
    this.parseIntDataAxes();
    return this.http.post<any>(`${environment.baseURL}/plotly_data`, this.plotBuilder);
  }

  parseIntDataAxes() {
    Object.keys(this.plotBuilder.data).forEach(key => {
      if (this.plotBuilder.data[key] !== 'D') {
        this.plotBuilder.data[key] = parseInt(this.plotBuilder.data[key], 10);
      }
    });
  }

  getPlotTypes() {
    return this.http.get(`${environment.baseURL}/plot_types`);
  }

  getReportPlotData(id) {
    // method used to get data for dashboard component
    return this.http.get(`${environment.baseURL}/report_plot_data/${id}`);
  }




}
