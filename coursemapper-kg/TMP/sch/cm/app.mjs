// node app.mjs

import * as sklearn from 'sklearn'
 
const data = [
  [0.1],
  [0.3],
  [0.1],
  [0.7]
]
 
const py = await sklearn.createPythonBridge()
 
// const s = new sklearn.StandardScaler()
const s = new sklearn.Normalizer("max")
await s.init(py)
 
const x = await s.fit_transform({ X: data })
console.log(x)