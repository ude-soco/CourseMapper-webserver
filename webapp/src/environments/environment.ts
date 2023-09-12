// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  API_URL: 'http://localhost:8080/api',
  apiUrl: 'http://localhost:8080',
};
export const environment_2 = {
  production: false,
  apiUrl: 'http://localhost:8090/api',
};

export const environment_Python = {  
  PYTHON_SERVER:"http://localhost:5000/"
  }
export const environment_Neo4j = {  
  neo4j_url : 'bolt://localhost:7687',
  neo4j_name : 'neo4j',
  neo4j_pass : '1234qwer!',
  }

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
