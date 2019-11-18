import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { UploadService } from 'src/app/shared/services/upload.service';
import { Brick, BrickDimension, DimensionVariable, TypedProperty, Term, DataValue } from 'src/app/shared/models/brick';
import { NgxSpinnerService } from 'ngx-spinner';
import { UploadValidationService } from 'src/app/shared/services/upload-validation.service';
import { Subscription } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {

  brick: Brick;
  dimVars: DimensionVariable[] = [];
  properties: TypedProperty[];
  dataVars: DataValue[];
  testArray = [];
  mapped = false;
  loading = false;
  error = false;
  errorSub: Subscription;
  modalRef: BsModalRef;


  constructor(
    private uploadService: UploadService,
    private spinner: NgxSpinnerService,
    private validator: UploadValidationService,
    private modalService: BsModalService
    ) { }

  ngOnInit() {
    this.brick = this.uploadService.getBrickBuilder();
    this.dataVars = this.brick.dataValues;
    this.properties = this.brick.properties;

    let dimCount = 0;
    this.brick.dimensions.forEach(dim => {
      dimCount += dim.variables.length;
      this.dimVars = [...this.dimVars, ...dim.variables];
    });

    this.errorSub = this.validator.getValidationErrors()
      .subscribe(error => this.error = error);
  }

  ngOnDestroy() {
    if (this.errorSub) {
      this.errorSub.unsubscribe();
    }
  }

  testMap() {
    this.loading = true;
    this.dimVars.forEach((_, i) => {
      this.spinner.show('d' + i);
    });
    this.properties.forEach((_, i) => {
      this.spinner.show('p' + i);
    });
    this.dataVars.forEach((_, i) => {
      this.spinner.show('v' + i);
    });

    setTimeout(() => {
      this.testArray = this.dimVars.map(() => Math.floor(Math.random() * 3 ) + 1);
      this.dimVars.forEach((dimVar, idx) => {
        dimVar.totalCount = 100;
        switch(this.testArray[idx]) {
          case 1:
            dimVar.mappedCount = dimVar.totalCount;
            break;
          case 2:
            dimVar.mappedCount = dimVar.totalCount - 5;
            break;
          case 3:
            dimVar.mappedCount = 0;
            break;
          default:
            dimVar.mappedCount = 0;
        }
      });
      this.brick.properties.forEach(prop => {
        prop.mappedCount = Math.floor(Math.random() * 2) === 0 ? 1 : 0;
      });

      this.dataVars.forEach(dataVar => {
        dataVar.mappedCount = Math.floor(Math.random() * 2) === 0 ? 1 : 0;
      });

      this.loading = false;
      // this.spinner.hide();
      this.dimVars.forEach((_, i) => {
        this.spinner.hide('d' + i);
      });
      this.properties.forEach((_, i) => {
        this.spinner.hide('p' + i);
      });
      this.dataVars.forEach((_, i) => {
        this.spinner.hide('v' + i);
      })
      this.mapped = true;
    }, 1000);
  }

  getMappedStatus(mapped, total) {
    if (mapped === total) {
      return 'status-column-success';
    }
    return mapped === 0 ? 'status-column-fail' : 'status-column-warn';
  }

  getPropValueDisplay(prop: TypedProperty) {
    return prop.scalarType === 'oterm_ref'
      ? (prop.value as Term).text
      : prop.value;
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

}
