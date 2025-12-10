import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserPkgResponse, RelatedConceptInfo } from '../pages/components/knowledge-graph/user-pkg/types/user-pkg.types';
import { CourseHierarchy} from '../pages/components/knowledge-graph/user-pkg/components/advanced-filters-dialog/advanced-filters.types';
type Neo4jResult = {
  records: any[];
};

type NodesAndEdges = {
  nodes: any[];
  edges: any[];
};

@Injectable({
  providedIn: 'root',
})
export class Neo4jService {
  constructor(public router: Router, private http: HttpClient) {}

  async checkSlide(slideId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/check-slide/${slideId}`
      )
    );
  }

  async getSlide(slideId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-slide/${slideId}`
      )
    );
  }

  async getUserRelationships(userId: number): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-user-relationships/${userId}`
      )
    );
  }

  async getRelationship(targetId: number): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-relationship/${targetId}`
      )
    );
  }

  async getHasConcept(targetId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-has-concept/${targetId}`
      )
    );
  }

  async getRelatedTo(courseId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-related-to/${courseId}`
      )
    );
  }

  async getHasCategory(conceptId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-has-category/${conceptId}`
      )
    );
  }

  async checkMaterial(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/check-material/${materialId}`
      )
    );
  }

  async getMaterial(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-material/${materialId}`
      )
    );
  }

  async getUser(userId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-user/${userId}`
      )
    );
  }

  async getSingleUser(userId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-single-user/${userId}`
      )
    );
  }

  async getLevelofEngagement(userId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-level-of-engagement/${userId}`
      )
    );
  }

  async getDNUEngagement(userId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-DNU-engagement/${userId}`
      )
    );
  }

  async getConceptSlide(
    materialId: string,
    conceptId: string
  ): Promise<number> {
    const result = await lastValueFrom(
      this.http.get<{ slideNo: number }>(
        `${environment.API_URL}/knowledge-graph/get-concept-slide/${materialId}/${conceptId}`
      )
    );
    return result.slideNo;
  }

  async getMaterialSlides(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-material-slides/${materialId}`
      )
    );
  }

  async getMaterialEdges(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-material-edges/${materialId}`
      )
    );
  }

  async getMaterialConceptsIds(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.get<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/get-material-concept-ids/${materialId}`
      )
    );
  }

  async getHigherLevelsNodesAndEdges(
    materialIds: string[]
  ): Promise<NodesAndEdges> {
    let params = new URLSearchParams(
      materialIds.map((id) => ['material_ids', id])
    );
    const res = await lastValueFrom(
      this.http.get<NodesAndEdges>(
        `${
          environment.API_URL
        }/knowledge-graph/get-higher-levels-nodes-and-edges?${params.toString()}`
      )
    );
    return res;
  }
  //////


  createUserCourseRelationship(userId: string, courseId: string, courseName: string): Observable<any> {
    return this.http.post<any>(
      `${environment.API_URL}/knowledge-graph/user/${userId}/course/${courseId}/create-relationship`,
      {},
      {
        params: {
          courseName: courseName
        }
      }
    );
  }


  removeUserCourseRelationship(
    userId: string,
    courseId: string
  ): Observable<any> {
    return this.http.delete<any>(
      `${environment.API_URL}/knowledge-graph/user/${userId}/course/${courseId}/remove-relationship`
    );
  }

  async createCourseConceptRelationship(
    courseId: string
  ): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.post<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/create-course-concept-relationship/${courseId}`,
        {}
      )
    );
  }

  async deleteRelationship(rid: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.delete<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/delete-relationship/${rid}`
      )
    );
  }

  async deleteHasConcept(courseId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.delete<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/delete-has-concept/${courseId}`
      )
    );
  }

  async deleteCourse(cid: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.delete<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/delete-course/${cid}`
      )
    );
  }

  updateConceptUDNU(
    source: string,
    target: string,
    type: string
  ): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.put<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/update-relationship-u-dnu/${source}/${target}/${type}`,
        {}
      )
    );
  }

  addCourseIdtoMaterial(materialId: string): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.put<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/add-courseId-to-material/${materialId}`,
        {}
      )
    );
  }

  renewConcept(conceptId: number): Promise<Neo4jResult> {
    return lastValueFrom(
      this.http.post<Neo4jResult>(
        `${environment.API_URL}/knowledge-graph/renew-concept/${conceptId}`,
        {}
      )
    );
  }

  /**
   * Get user's personal knowledge graph data
   * @param userId - User ID
   * @param topN - Optional limit on number of concepts
   * @param slideIds - Optional array of slide IDs to filter concepts by
   */
  getUserPkg(userId: string, topN?: number | 'All', slideIds?: string[]): Observable<UserPkgResponse> {
    let params = new HttpParams();
    
    if (topN && topN !== 'All') {
      params = params.set('topN', topN.toString());
    }

    if (slideIds && slideIds.length > 0) {
      params = params.set('slideIds', JSON.stringify(slideIds));
    }

    return this.http.get<UserPkgResponse>(
      `${environment.API_URL}/knowledge-graph/get-user-pkg/${userId}`,
      { params }
    );
  }

  /**
   * Get related concepts for a specific concept (on-demand)
   */
  getRelatedConcepts(conceptCid: string): Observable<{ relatedConcepts: RelatedConceptInfo[] }> {
    return this.http.get<{ relatedConcepts: RelatedConceptInfo[] }>(
      `${environment.API_URL}/knowledge-graph/get-related-concepts/${conceptCid}`
    );
  }

  /**
   * Get course hierarchy for advanced filters
   * Returns enrolled courses with their materials and slides
   */
  getCourseHierarchy(): Observable<{ courses: CourseHierarchy[] }> {
    return this.http.get<{ courses: CourseHierarchy[] }>(
      `${environment.API_URL}/knowledge-graph/course-hierarchy`
    );
  }
}

