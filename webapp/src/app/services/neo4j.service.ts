import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment_Python } from 'src/environments/environment';
// TODO remove neo4j from package.json

type Neo4jResult = {
  records: any[]
}

@Injectable({
  providedIn: 'root'
})
export class Neo4jService {

  constructor(public router: Router, private http: HttpClient) { }

  async checkSlide(slideId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment_Python.PYTHON_SERVER}check_slide/${slideId}`
    ));
  }

  async getSlide(slideId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment_Python.PYTHON_SERVER}get_slide/${slideId}`
    ));
  }

  async checkMaterial(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment_Python.PYTHON_SERVER}check_material/${materialId}`
    ));
  }

  async getMaterial(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment_Python.PYTHON_SERVER}get_material/${materialId}`
    ));
  }

  async deleteMaterial(materialId: string) {
    // console.log("delete material from neo4j service")
    return lastValueFrom(this.http.delete(
      `${environment_Python.PYTHON_SERVER}delete_material/${materialId}`
    ));
    
  }


  async getMaterialEdges(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment_Python.PYTHON_SERVER}get_material_edges/${materialId}`
    ));
  }

  async getMaterialConceptsIds(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment_Python.PYTHON_SERVER}get_material_concept_ids/${materialId}`
    ));
  }

  async getHigherLevelsNodes(materialIds: string[]): Promise<Neo4jResult> {
    let params = new URLSearchParams(materialIds.map((id) => ['material_ids', id]))
    const res = await lastValueFrom(this.http.get<Neo4jResult>(
      `${environment_Python.PYTHON_SERVER}get_higher_levels_nodes?${params.toString()}`
    ));
    console.log('------', res)
    return res
  }

  async getHigherLevelsEdges(materialIds: string[]): Promise<Neo4jResult> {
    let params = new URLSearchParams(materialIds.map((id) => ['material_ids', id]))
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment_Python.PYTHON_SERVER}get_higher_levels_edges?${params.toString()}`
    ));
  }
}
