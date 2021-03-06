import { Component, OnInit, OnDestroy } from '@angular/core';
import { UploadService } from 'src/app/shared/services/upload.service';
import { Brick, TypedProperty } from 'src/app/shared/models/brick';
import { UploadValidationService } from 'src/app/shared/services/upload-validation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-property-builder',
  templateUrl: './property-builder.component.html',
  styleUrls: ['./property-builder.component.css']
})
export class PropertyBuilderComponent implements OnInit, OnDestroy {

  public properties: TypedProperty[];
  brick: Brick;
  errors = false;
  errorMessages: string[] = [];
  errorSub = new Subscription();

  constructor(
    private uploadService: UploadService,
    private validator: UploadValidationService,
  ) {
    this.brick = this.uploadService.getBrickBuilder();
    this.properties = this.brick.properties;
   }

  ngOnInit() {
    this.errorSub = this.validator.getValidationErrors()
      .subscribe(res => {
        this.errors = res.error;
        this.errorMessages = res.messages;
      });
  }

  ngOnDestroy() {
    if (this.errorSub) {
      this.errorSub.unsubscribe();
    }
  }

  addProperty() {
    this.properties.push(new TypedProperty(this.properties.length, false));
  }

  deleteProperty(property) {
    this.brick.properties = this.brick.properties.filter(item => item !== property);
    this.properties = this.brick.properties;
  }

  resetProperty(event: TypedProperty) {
    this.brick.properties.splice(event.index, 1, event);
  }

  setValueError(event) {
    if (event) {
      this.errors = true;
      this.errorMessages.push(event);
    } else {
      if (this.errorMessages.length === 1) {
        this.errors = false;
        this.errorMessages = [];
      }
    }
  }

}
