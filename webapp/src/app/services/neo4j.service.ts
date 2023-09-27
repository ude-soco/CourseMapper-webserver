import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment_Neo4j } from 'src/environments/environment';
var neo4j = require('neo4j-driver');

@Injectable({
  providedIn: 'root'
})
export class Neo4jService {

  neo4j_url=environment_Neo4j.neo4j_url
  neo4j_name=environment_Neo4j.neo4j_name
  neo4j_pass=environment_Neo4j.neo4j_pass

  neo4jDriver = neo4j.driver(
    this.neo4j_url,
    neo4j.auth.basic(this.neo4j_name, this.neo4j_pass)
  );
  session = this.neo4jDriver.session();

  constructor(public router:Router) { }
  async checkSlide(slideId: string) {
    return this.session
      .run('MATCH(s:Slide)  WHERE s.sid = $sid RETURN s', { sid: slideId })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  async getSlide(slideId: string) {
    return this.session
      .run(
        'MATCH p=(s: Slide)-[r]->(c: Concept) WHERE s.sid = $sid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract',
        { sid: slideId }
      )
      .then((slideNode) => {
        return slideNode;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  async checkMaterial(materialId: string) {
    return this.session
      .run('MATCH (m:LearningMaterial) WHERE m.mid = $mid RETURN m', {
        mid: materialId,
      })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        window.location.reload()
        console.log(err);
   
      });
  }
  reloadComponent(self:boolean,urlToNavigateTo ?:string){
    //skipLocationChange:true means dont update the url to / when navigating
   console.log("Current route I am on:",this.router.url);
   const url=self ? this.router.url :urlToNavigateTo;
   this.router.navigateByUrl('/',{skipLocationChange:true}).then(()=>{
     this.router.navigate([`/${url}`]).then(()=>{
       console.log(`After navigation I am on:${this.router.url}`)
     })
   })
 }
  reloadCurrent(){
    this.reloadComponent(true);
  }
  async getMaterial(materialId: string) {
    return this.session
      .run(
        'MATCH (c:Concept) WHERE c.mid = $mid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank',
        { mid: materialId }
      )
      .then((materialRecords) => {
        return materialRecords;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  async getMaterialEdges(materialId: string) {
    return this.session
    .run(
      "MATCH p=(a)-[r]->(b) WHERE TYPE(r) <> 'CONTAINS' AND a.mid = $mid AND b.mid = $mid RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight",
      { mid: materialId }
      )
      .then((materialRecords) => {
        return materialRecords;
      })
      .catch((err) => {
        console.log(err);
      });
    }

  async getRelationship(userId: string, resourceId) {
    return this.session
      .run(
        'MATCH p=(a)-[r]->(b) WHERE a.uid = $uid AND b.rid = $rid RETURN TYPE(r) as type, ID(a) as source, ID(b) as target',
        { rid: resourceId, uid: userId }
      )
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }

    async getMaterialConceptsIds(materialId: string) {
      return this.session
        .run(
          'MATCH (c:Concept) WHERE c.mid = $mid RETURN c.cid AS id, c.name as name',
          // 'MATCH (c:Concept) WHERE c.mid = $mid RETURN ID(c) AS id, c.name as name',
          { mid: materialId }
        )
        .then((materialRecords) => {
          return materialRecords;
        })
        .catch((err) => {
          console.log(err);
        });
    }
    async getHigherLevelsNodes(query: string) {
      return this.session
        .run(
          query
        )
        .then((materialRecords) => {
          return materialRecords;
        })
        .catch((err) => {
          console.log(err);
        });
    }
    async getHigherLevelsEdges(query: string) {
    return this.session
        .run(
          query
        )
        .then((materialRecords) => {
          return materialRecords;
        })
        .catch((err) => {
          console.log(err);
        });
    }
}
