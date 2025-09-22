import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfviewService {
  private docURL= new BehaviorSubject("")
  currentDocURL=this.docURL.asObservable();
  private pageNumber=new BehaviorSubject(1)
  currentPageNumber=this.pageNumber.asObservable()
  private coordinates= new BehaviorSubject({page:1,coords:[]})
  currentCoords=this.coordinates.asObservable()
  private totalPages=new BehaviorSubject(0)
  totalpages$=this.totalPages.asObservable()
  private firstPageNumber=new BehaviorSubject(0)
  firstPageNumber$=this.firstPageNumber.asObservable()
  private pdfErrorSubject = new BehaviorSubject<string | null>(null); // null = no error
  pdfError$ = this.pdfErrorSubject.asObservable();
  @Output() currentPageNumberEvent: EventEmitter<any> = new EventEmitter();
  constructor() { }
  
  setPdfURL(src:any){
    this.docURL.next(src);
  }
  setPageNumber(numb:number){
    this.pageNumber.next(numb)
    this.currentPageNumberEvent.emit(numb)
   
  }
  setCoodinates(data:any){
    this.coordinates.next(data)
  }
  setTotalPages(numb:number){
    this.totalPages.next(numb)
  }
  setFirstPageNumber(numb:number){
    this.firstPageNumber.next(numb)
  }
  emitError(materialId: string) {
    this.pdfErrorSubject.next(materialId);
  }
  
  clearError() {
    this.pdfErrorSubject.next(null);
  }

}
