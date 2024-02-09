import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

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
      `${environment.API_URL}/knowledge-graph/check-slide/${slideId}`
    ));
  }

  async getSlide(slideId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment.API_URL}/knowledge-graph/get-slide/${slideId}`
    ));
  }

  async checkMaterial(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment.API_URL}/knowledge-graph/check-material/${materialId}`
    ));
  }

  async getMaterial(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment.API_URL}/knowledge-graph/get-material/${materialId}`
    ));
  }

  async deleteMaterial(materialId: string) {
    // console.log("delete material from neo4j service")
    return lastValueFrom(this.http.delete(
      `${environment.API_URL}/knowledge-graph/delete-material/${materialId}`
    ));

  }


  async getMaterialEdges(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment.API_URL}/knowledge-graph/get-material-edges/${materialId}`
    ));
  }

  async getMaterialConceptsIds(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment.API_URL}/knowledge-graph/get-material-concept-ids/${materialId}`
    ));
  }

  async getHigherLevelsNodes(materialIds: string[]): Promise<Neo4jResult> {
    let params = new URLSearchParams(materialIds.map((id) => ['material_ids', id]))
    const res = await lastValueFrom(this.http.get<Neo4jResult>(
      `${environment.API_URL}/knowledge-graph/get-higher-levels-nodes?${params.toString()}`
    ));
    return res
  }

  async getHigherLevelsEdges(materialIds: string[]): Promise<Neo4jResult> {
    let params = new URLSearchParams(materialIds.map((id) => ['material_ids', id]))
    return lastValueFrom(this.http.get<Neo4jResult>(
      `${environment.API_URL}/knowledge-graph/get-higher-levels-edges?${params.toString()}`
    ));
  }
}
