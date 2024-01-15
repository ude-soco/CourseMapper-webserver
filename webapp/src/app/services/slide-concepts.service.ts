import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SlideConceptsService {
  public allConcepts = new Subject<any[]>();
  public newConcepts = new Subject<any[]>();
  public didNotUnderstandConcepts = new Subject<any[]>();
  public understoodConcepts = new Subject<any[]>();
  public didNotUnderstandAllConceptsSubject=new Subject<any[]>();

  
  public didNotUnderstandAllConcepts=[]
  private commonDidNotUnderstandConcepts=[]
  private commonUnderstoodConcepts=[]
  private commonNewConcepts=[]
  constructor() {
    this.newConcepts = new Subject();
    this.didNotUnderstandConcepts = new Subject();
    this.understoodConcepts = new Subject();
  }
  setAllConcepts(list: string[]) {
    this.allConcepts.next(list);
    // console.log(list)
  }
  setNewConcepts(list:string[]){
    this.commonNewConcepts=list
    this.newConcepts.next(list);
    // console.log(this.commonNewConcepts)
  }
  updateNewConcepts(concept: any) {
    if(this.commonNewConcepts.some(e=> e.cid.toString()===concept.cid.toString())){
    }else{
      this.commonNewConcepts.push(concept)
      if(this.commonDidNotUnderstandConcepts.some(e=> e.cid.toString()===concept.cid.toString())){
        this.commonDidNotUnderstandConcepts.some((node, index)=>{
          if(node.cid.toString()===concept.cid.toString()){
            this.commonDidNotUnderstandConcepts.splice(index,1)
          }
        })
      }            
      else if(this.commonUnderstoodConcepts.some(e=> e.cid.toString()===concept.cid.toString())){
        this.commonUnderstoodConcepts.some((node, index)=>{
          if(node.cid.toString()===concept.cid.toString()){
            this.commonUnderstoodConcepts.splice(index,1)
          }
        })
      }
    }
    this.setNewConcepts(this.commonNewConcepts)
    this.setDidNotUnderstandConcepts(this.commonDidNotUnderstandConcepts)
    this.setUnderstoodConcepts(this.commonUnderstoodConcepts)
  }

  setDidNotUnderstandConcepts(list: string[]) {
    this.commonDidNotUnderstandConcepts=list
    this.didNotUnderstandConcepts.next(list);
    // console.log(this.commonDidNotUnderstandConcepts)
  }
  setAllNotUnderstoodConcepts(list: string[]){
    console.log(list)
    this.didNotUnderstandAllConcepts=list
    this.didNotUnderstandAllConceptsSubject.next(list)
  }
  allNotunderstoodObserved():Observable<any>{
    return this.didNotUnderstandAllConceptsSubject.asObservable()
  }
  updateDidNotUnderstandConcepts(concept: any) {
    // console.log(concept)
    if(this.commonDidNotUnderstandConcepts.some(e=> e.cid.toString()===concept.cid.toString())){
    }else{
      this.commonDidNotUnderstandConcepts.push(concept)
      if(this.commonNewConcepts.some(e=> e.cid.toString()===concept.cid.toString())){
        this.commonNewConcepts.some((node, index)=>{
          if(node.cid.toString()===concept.cid.toString()){
            this.commonNewConcepts.splice(index,1)
          }
        })
      }            
      else if(this.commonUnderstoodConcepts.some(e=> e.cid.toString()===concept.cid.toString())){
        this.commonUnderstoodConcepts.some((node, index)=>{
          if(node.cid.toString()===concept.cid.toString()){
            this.commonUnderstoodConcepts.splice(index,1)
          }
        })
      }
    }
    this.setNewConcepts(this.commonNewConcepts)
    this.setDidNotUnderstandConcepts(this.commonDidNotUnderstandConcepts)
    this.setUnderstoodConcepts(this.commonUnderstoodConcepts)
  }
  setUnderstoodConcepts(list: string[]) {
    this.commonUnderstoodConcepts=list
    this.understoodConcepts.next(list);
    // console.log(this.commonUnderstoodConcepts)
  }
  updateUnderstoodConcepts(concept: any) {
    if(this.commonUnderstoodConcepts.some(e=> e.cid.toString()===concept.cid.toString())){
    }else{
      this.commonUnderstoodConcepts.push(concept)
      if(this.commonNewConcepts.some(e=> e.cid.toString()===concept.cid.toString())){
        this.commonNewConcepts.some((node, index)=>{
          if(node.cid.toString()===concept.cid.toString()){
            this.commonNewConcepts.splice(index,1)
          }
        })
      }            
      else if(this.commonDidNotUnderstandConcepts.some(e=> e.cid.toString()===concept.cid.toString())){
        this.commonDidNotUnderstandConcepts.some((node, index)=>{
          if(node.cid.toString()===concept.cid.toString()){
            this.commonDidNotUnderstandConcepts.splice(index,1)
          }
        })
      }
    }
    this.setNewConcepts(this.commonNewConcepts)
    this.setDidNotUnderstandConcepts(this.commonDidNotUnderstandConcepts)
    this.setUnderstoodConcepts(this.commonUnderstoodConcepts)
  }
}
