import { Component, OnInit, OnDestroy } from '@angular/core';
import { UploadDragDropDirective } from 'src/app/shared/directives/upload-drag-drop.directive';
import { UploadService } from 'src/app/shared/services/upload.service';
import { Brick, BrickDimension, TypedProperty, Term } from 'src/app/shared/models/brick';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { UploadValidationService } from 'src/app/shared/services/upload-validation.service';


@Component({
  selector: 'app-load',
  templateUrl: './load.component.html',
  styleUrls: ['./load.component.css'],
  viewProviders: [UploadDragDropDirective]
})
export class LoadComponent implements OnInit, OnDestroy {

  constructor(
    private uploadService: UploadService,
    private spinner: NgxSpinnerService,
    private validator: UploadValidationService
  ) { }

  file: File = null;
  fileSize: string;
  brick: Brick;
  successData: any;
  error = false;
  errorMessage: string;
  loading = false;
  validationError = false;
  validationErrorSub: Subscription

  ngOnInit() {
    this.brick = this.uploadService.getBrickBuilder();
    this.validationErrorSub = this.validator.getValidationErrors()
     .subscribe(error => this.validationError = error);
  }

  ngOnDestroy() {
    if (this.validationErrorSub) {
      this.validationErrorSub.unsubscribe();
    }
  }

  handleFileInput(files: FileList) {
    this.file = files.item(0);
    if (this.file.size > 1000000) {
      this.fileSize = `${this.file.size / 1000000} MB`;
    } else {
      this.fileSize = `${this.file.size / 1000} KB`;
    }
   }

   downloadTemplate() {
     this.uploadService.downloadBrickTemplate()
      .subscribe((data: Blob) => {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      });
   }

   upload() {
    this.loading = true;
    this.spinner.show();
    this.uploadService.uploadBrick(this.file).then((res: any) => {
      this.loading = false;
      this.spinner.hide();
      this.successData = res.results;
    },
    err => {
      this.spinner.hide();
      this.error = true;
      this.errorMessage = err.error;
      this.loading = false;
    }
    );
   }

   removeFile() {
     this.file = null;
     this.error = false;
     delete this.errorMessage;
   }

}
