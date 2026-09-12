import assert from "node:assert/strict";
import { constellation } from "../lib/constellation.ts";
const nodes=[],edges=[];
for(let i=0;i<200;i++) {
  nodes.push({id:`s:${i}`,kind:"space",entity_id:i,label:`Space ${i}`,description:"A need",recent:50,total:50,parents:i<10?[]:[`s:${i%10}`],domains:[]});
  if(i>=10)edges.push({source:`s:${i%10}`,target:`s:${i}`,kind:"subcategory",explanation:"Narrower"});
}
for(let i=0;i<400;i++) {
  nodes.push({id:`p:${i}`,kind:"project",entity_id:i,label:`Project ${i}`,description:"A build",recent:0,total:0,parents:[],domains:[]});
  edges.push({source:`s:${10+i%190}`,target:`p:${i}`,kind:"membership",explanation:"Addresses need"});
}
const data={nodes,edges,bounded:true,total_spaces:200,space_budget:200,project_budget:400};
const before=performance.now();const positions=constellation(data);const elapsed=performance.now()-before;
assert.equal(positions.size,600);
for(const p of positions.values()) assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.hypot(p.x,p.y)<=.930001);
assert.ok([...positions.values()].filter(p=>Math.hypot(p.x,p.y)>.92).length<60,"Nodes must not pile up against the circular boundary");
assert.deepEqual(positions,constellation(data));
assert.ok(elapsed<2000,`Layout took ${elapsed}ms`);
console.log(`600-node deterministic disk layout: ${elapsed.toFixed(1)}ms; finite and repeatable.`);
