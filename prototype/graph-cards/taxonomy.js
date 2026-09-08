// Throwaway taxonomy experiment. Broaden authored memberships, not a classifier.
// Match the need addressed; audience, technology and interface are not required.
let taxonomySpaceMap=new Map();
function broadenTaxonomy(){
 if(new URLSearchParams(location.search).get('taxonomy')==='legacy')return;
 const groups=[
  ['learn','Learning and understanding','purple',['learning'],'Helps someone learn, practice, investigate, or explain something.'],
  ['care','Giving and receiving care','aqua',['care'],'Supports practical care, recovery, or emotional support.'],
  ['move','Getting around','aqua',['mobility'],'Helps people or goods reach places safely and accessibly.'],
  ['food','Feeding ourselves','yellow',['food'],'Helps people source, prepare, share, or avoid wasting food.'],
  ['home','Living together','orange',['home'],'Helps people maintain homes, share resources, or manage everyday life.'],
  ['community','Participating in community','blue',['civic'],'Helps people participate in decisions, organize help, or access shared services.'],
  ['culture','Sharing culture and memory','purple',['culture'],'Helps people preserve, discover, practice, or share cultural knowledge.'],
  ['trade','Making a living','yellow',['commerce'],'Helps people offer goods or services and manage the work around them.'],
  ['nature','Understanding and caring for nature','aqua',['environment'],'Helps people observe living things, grow plants, or care for their surroundings.'],
  ['resources','Using resources wisely','aqua',['environment'],'Helps people understand or reduce resource consumption.'],
  ['create','Creating and expressing','orange',['creative'],'Helps people make, explore, or express ideas through creative work.'],
  ['knowledge','Finding and keeping knowledge','blue',['developer'],'Helps people retrieve, organize, or preserve information.'],
  ['build','Building reliable software','blue',['developer'],'Helps people understand, build, or repair software systems.'],
  ['wellbeing','Supporting everyday wellbeing','purple',['wellbeing'],'Supports attention, rest, or sustainable everyday routines.']
 ];
 const domainGroups={learning:'learn',care:'care',mobility:'move',food:'food',home:'home',civic:'community',culture:'culture',commerce:'trade',environment:'nature',creative:'create',developer:'knowledge',wellbeing:'wellbeing'};
 const original=[...spaces];
 function targets(id,seen=new Set()){
  if(seen.has(id))return [];seen.add(id);
  if(id==='energy')return ['resources'];
  if(id==='debug')return ['build'];
  if(domainGroups[id])return [domainGroups[id]];
  return (original.find(n=>n.id===id)?.parents||[]).flatMap(p=>targets(p,new Set(seen)));
 }
 original.forEach(n=>taxonomySpaceMap.set(n.id,[...new Set(targets(n.id))].map(id=>'need-'+id)));
 // Keep meaningful needs beneath the broad entry points. Fold the old
 // interface-specific '-tools' layer into its nearest specific problem space.
 function specificTargets(id,seen=new Set()){
  if(seen.has(id))return [];seen.add(id);
  const node=original.find(n=>n.id===id);
  if(!node)return [];
  if(!node.child)return [id];
  return node.parents.flatMap(parent=>specificTargets(parent,new Set(seen)));
 }
 projects.forEach(p=>{p.spaces=[...new Set(p.spaces.flatMap(id=>specificTargets(id)))];});
 const specific=original.filter(n=>!n.child).map(n=>({
  ...n,child:true,parents:taxonomySpaceMap.get(n.id)||[],
  criterion:`Addresses ${n.name.toLowerCase()}, regardless of audience, technology, or interface.`
 }));
 const broad=groups.map(([id,name,color,parents,criterion])=>({id:'need-'+id,name,color,parents,criterion})).filter(n=>specific.some(s=>s.parents.includes(n.id)));
 spaces.splice(0,spaces.length,...broad,...specific);
 allNodes.splice(0,allNodes.length,...domains,...spaces);
}
