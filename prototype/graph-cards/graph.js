// Throwaway relationship-layout experiment. Suggestions are authored fixtures.
let positions=new Map(),graphWidth=1400,graphHeight=900,layoutKey='';
let graphGesture=null;
let renderedDetail=-1;
function graphDetail(){return state.zoom>=2.6?2:state.zoom>=1.6||state.expanded?1:0;}
function activateGraphNode(id){if(id.startsWith('project:'))openDetail(id.slice(8));else setSelected(id);}
function graphPoint(event,element){return new DOMPoint(event.clientX,event.clientY).matrixTransform(element.getScreenCTM().inverse());}
function previewRelationships(id){
 const related=new Set([id]);
 const descriptions=[];
 $('#edges').querySelectorAll('.edge').forEach(edge=>{
  const active=Boolean(id)&&(edge.dataset.from===id||edge.dataset.to===id);
  edge.classList.toggle('hover-related',active);
  if(active){const other=edge.dataset.from===id?edge.dataset.to:edge.dataset.from;related.add(other);descriptions.push(`${label(other)} — ${edge.classList.contains('suggested')?'suggested':edge.classList.contains('shared')?'shared projects':edge.classList.contains('membership')?'project membership':'subcategory'}`);}
 });
 $('#graph').classList.toggle('is-hovering',Boolean(id));
 $('#nodes').querySelectorAll('.node').forEach(node=>node.classList.toggle('hover-related',Boolean(id)&&related.has(node.dataset.id)));
 const preview=$('#graph-preview');
 preview.hidden=!id;
 preview.textContent=id?`${label(id)}\n${descriptions.length?descriptions.join('\n'):'No visible connections'} `:'';
}
function setupGraphGestures(){
 const svg=$('#graph');
 const preview=document.createElement('div');preview.id='graph-preview';preview.hidden=true;preview.className='graph-preview';$('.graph-stage').append(preview);
 svg.addEventListener('wheel',event=>{
  event.preventDefault();if(graphGesture)return;
  const at=graphPoint(event,$('#viewport')),root=graphPoint(event,svg);
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?svg.clientHeight:1);
  state.zoom=Math.max(.6,Math.min(6,state.zoom*Math.exp(-delta*.0015)));
  state.panX=root.x-graphWidth/2-(at.x-graphWidth/2)*state.zoom;
  state.panY=root.y-graphHeight/2-(at.y-graphHeight/2)*state.zoom;
  applyTransform();
 },{passive:false});
 svg.addEventListener('pointerdown',event=>{
  if(event.button!==0||graphGesture)return;
  moved=false;
  const node=event.target.closest('.node'),point=graphPoint(event,node?$('#viewport'):svg);
  graphGesture={pointer:event.pointerId,id:node?.dataset.id,startX:event.clientX,startY:event.clientY,x:point.x,y:point.y,panX:state.panX,panY:state.panY};
  if(node){const p=positions.get(node.dataset.id);graphGesture.offsetX=p.x-point.x;graphGesture.offsetY=p.y-point.y;}
  svg.setPointerCapture(event.pointerId);svg.classList.add('is-dragging');
 });
 svg.addEventListener('pointermove',event=>{
  const g=graphGesture;if(!g||g.pointer!==event.pointerId)return;
  if(Math.hypot(event.clientX-g.startX,event.clientY-g.startY)>4)moved=true;
  if(!moved)return;
  const point=graphPoint(event,g.id?$('#viewport'):svg);
  if(g.id){
   const p=positions.get(g.id);p.x=point.x+g.offsetX;p.y=point.y+g.offsetY;
   const node=$('#nodes').querySelector(`[data-id="${g.id}"]`);node.setAttribute('transform',`translate(${p.x},${p.y})`);
   $('#edges').querySelectorAll('.edge').forEach(edge=>{if(edge.dataset.from===g.id){edge.setAttribute('x1',p.x);edge.setAttribute('y1',p.y);}if(edge.dataset.to===g.id){edge.setAttribute('x2',p.x);edge.setAttribute('y2',p.y);}});
   updateGraphLabels();
  }else{state.panX=g.panX+point.x-g.x;state.panY=g.panY+point.y-g.y;applyTransform();}
 });
 function end(event){
  if(!graphGesture||graphGesture.pointer!==event.pointerId)return;
  const selectId=event.type==='pointerup'&&!moved?graphGesture.id:null;
  graphGesture=null;svg.classList.remove('is-dragging');
  if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
  previewRelationships(null);
  if(selectId)activateGraphNode(selectId);
 }
 svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('lostpointercapture',end);
}
const proposedConnections=[
 ['gardening','food-home-cooking','A harvest-aware meal planner could transfer seasonal growing schedules into ingredient planning.'],
 ['energy','food-food-waste','Both turn invisible household waste into feedback that helps people change recurring habits.'],
 ['worlds','learning-classroom-making','Small simulated worlds can let learners explore the consequences of something they build.'],
 ['visual','culture-craft-practice','Recording gestures and intermediate steps can make a creative technique easier to learn from someone else.'],
 ['music','culture-community-performance','Tools for rehearsing and assembling sounds can support small groups preparing a live performance.'],
 ['local','culture-local-archives','Retrieval tools can make scattered community records discoverable without moving them to a central service.'],
 ['debug','care-care-coordination','A timeline of handoffs can help people find where context was lost; care requires consent and privacy beyond software tracing.'],
 ['focus','learning-independent-study','Flexible work sessions and gentle reminders can help a learner sustain a self-directed routine.'],
 ['wildlife','learning-research-practice','Repeated field observations can become evidence that learners compare and question.'],
 ['home-neighbor-exchange','care-childcare-circles','Both coordinate availability, trust, and cancellations among people sharing practical help.'],
 ['home-repair-knowledge','culture-craft-practice','Annotated process notes can preserve hands-on knowledge and explain why a particular technique worked.'],
 ['mobility-accessible-travel','care-aging-in-place','Both benefit from descriptions of physical barriers tailored to a person’s changing access needs.'],
 ['civic-mutual-aid','food-food-waste','Matching timely offers with nearby needs could help volunteers redistribute surplus food.'],
 ['commerce-service-scheduling','care-respite-planning','Availability matching can help arrange short breaks, with attention to trusted helpers and continuity.'],
 ['civic-neighborhood-planning','mobility-street-safety','Resident observations can inform proposals for safer crossings and walking routes.'],
 ['commerce-inventory-visibility','home-home-inventory','Knowing what is available and where it lives can reduce duplicate purchases and unnecessary searching.'],
 ['culture-cultural-translation','learning-language-learning','Keeping social context beside phrases can support respectful practice rather than word-for-word substitution.'],
 ['gardening','worlds','Growing systems can inspire simulations where small actions have visible, gradual consequences.'],
 ['music','focus','Sound-design techniques can support adjustable listening environments for focused work.'],
 ['local','debug','Following a thread across scattered records can help reconstruct the context behind an unexpected result.']
];
function suggestions(){return proposedConnections.filter(([a,b])=>spaces.some(n=>n.id===a)&&spaces.some(n=>n.id===b));}
function spaceDomains(id,seen=new Set()){
 if(seen.has(id))return [];seen.add(id);
 const n=allNodes.find(n=>n.id===id);
 return n?.domain?[id]:(n?.parents||[]).flatMap(p=>spaceDomains(p,seen));
}
function graphEdges(visible){
 const ids=new Set(visible.map(n=>n.id)),edges=[];
 visible.forEach(n=>n.parents.filter(id=>ids.has(id)).forEach(id=>edges.push({from:id,to:n.id,type:'parent'})));
 // Shared membership is observable in this fictional catalog; ancestor overlap
 // is excluded so a hierarchy does not become a clique of duplicate edges.
 for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
  const a=visible[i],b=visible[j];
  if(descendantIds(a.id).has(b.id)||descendantIds(b.id).has(a.id))continue;
  const aIds=new Set(members(a.id).map(p=>p.id));
  const shared=members(b.id).filter(p=>aIds.has(p.id)).length;
  if(shared)edges.push({from:a.id,to:b.id,type:'shared',shared});
 }
 if(state.suggestions!==false)suggestions().forEach(([from,to,reason])=>{if(ids.has(from)&&ids.has(to))edges.push({from,to,type:'suggested',reason});});
 return edges;
}
function renderGraph(){
 cancelAnimationFrame(frame);
 if($('#graph-preview'))previewRelationships(null);
 const mobile=matchMedia('(max-width:750px)').matches;
 graphWidth=mobile?760:1400;graphHeight=mobile?1050:850;
 $('#graph').setAttribute('viewBox',`0 0 ${graphWidth} ${graphHeight}`);
 renderedDetail=graphDetail();
 const visible=spaces.filter(n=>(!n.child||renderedDetail>=1||n.id===state.selected)&&(!n.old||state.older)&&(!state.domain||spaceDomains(n.id).includes(state.domain)));
 const edges=graphEdges(visible);
 const spaceIds=new Set(visible.map(n=>n.id));
 if(renderedDetail===2)projects.forEach(project=>{
  const parents=project.spaces.filter(id=>spaceIds.has(id));
  if(!parents.length)return;
  const id='project:'+project.id;
  visible.push({id,name:project.name,project:true,parents,color:spaces.find(n=>n.id===parents[0]).color});
  parents.forEach(from=>edges.push({from,to:id,type:'membership'}));
 });
 const key=state.domain+':'+state.older+':'+mobile+':'+(state.suggestions!==false);
 if(key!==layoutKey){
  layoutKey=key;positions.clear();
  visible.forEach((n,i)=>{const angle=i*2.399963,r=38*Math.sqrt(i+1);positions.set(n.id,{x:Math.cos(angle)*r,y:Math.sin(angle)*r,vx:0,vy:0});});
  // Springs, repulsion and weak common gravity; no domain anchors or grid.
  for(let tick=0;tick<420;tick++){
   for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
    const a=positions.get(visible[i].id),b=positions.get(visible[j].id),dx=a.x-b.x,dy=a.y-b.y,d=Math.max(1,Math.hypot(dx,dy));
    const force=Math.min(12,2100/(d*d))+(d<75?(75-d)*.045:0);
    a.vx+=dx/d*force;a.vy+=dy/d*force;b.vx-=dx/d*force;b.vy-=dy/d*force;
   }
   edges.forEach(e=>{const a=positions.get(e.from),b=positions.get(e.to),dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));
    const strength=e.type==='suggested'?.003:e.type==='parent'?.022:.013;
    const force=(d-(e.type==='suggested'?180:115))*strength;
    a.vx+=dx/d*force;a.vy+=dy/d*force;b.vx-=dx/d*force;b.vy-=dy/d*force;
   });
   positions.forEach(p=>{p.vx=(p.vx-p.x*.0015)*.72;p.vy=(p.vy-p.y*.0015)*.72;p.x+=p.vx;p.y+=p.vy;});
  }
  if(visible.length){
   const ps=[...positions.values()],minX=Math.min(...ps.map(p=>p.x)),maxX=Math.max(...ps.map(p=>p.x)),minY=Math.min(...ps.map(p=>p.y)),maxY=Math.max(...ps.map(p=>p.y));
   const scale=Math.min((graphWidth-260)/Math.max(1,maxX-minX),(graphHeight-140)/Math.max(1,maxY-minY),1.8);
   positions.forEach(p=>{p.x=(p.x-(minX+maxX)/2)*scale+graphWidth/2;p.y=(p.y-(minY+maxY)/2)*scale+graphHeight/2;});
  }
 }
 // Revealing detail never moves existing anchors or resets the camera.
 // Keep hidden coordinates too, so collapsing and reopening is stable.
 visible.forEach(n=>{
  if(positions.has(n.id))return;
  const parent=n.parents.map(id=>positions.get(id)).find(Boolean)||{x:graphWidth/2,y:graphHeight/2};
  const siblings=visible.filter(other=>other.parents.includes(n.parents[0])&&Boolean(other.project)===Boolean(n.project));
  const index=siblings.findIndex(other=>other.id===n.id),angle=index*2.399963;
  const radius=(n.project?25:48)+Math.sqrt(index)*12;
  positions.set(n.id,{x:parent.x+Math.cos(angle)*radius,y:parent.y+Math.sin(angle)*radius,vx:0,vy:0});
 });
 const neighbors=new Set([state.selected]);edges.filter(e=>e.from===state.selected||e.to===state.selected).forEach(e=>{neighbors.add(e.from);neighbors.add(e.to);});
 const matches=state.query.trim()?new Set(filtered().flatMap(p=>p.spaces)):null;
 $('#edges').innerHTML=edges.map(e=>{const a=positions.get(e.from),b=positions.get(e.to);return `<line data-from="${e.from}" data-to="${e.to}" class="edge ${e.type} ${state.selected&&(e.from===state.selected||e.to===state.selected)?'selected':''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><title>${e.type==='suggested'?'Suggested: '+e.reason:e.type==='shared'?e.shared+' shared projects' :e.type==='membership'?'Project membership':'Subcategory relationship'}</title></line>`;}).join('');
 $('#nodes').innerHTML=visible.map(n=>{const p=positions.get(n.id),r=n.project?4:6+Math.sqrt(count(n.id))*2;return `<g class="node ${n.project?'project-node':''} ${state.selected===n.id?'selected':''} ${state.selected&&!neighbors.has(n.id)||matches&&!matches.has(n.id)?'dim':''}" transform="translate(${p.x},${p.y})" data-id="${n.id}" role="button" tabindex="0" aria-pressed="${state.selected===n.id}" aria-label="${n.name}, ${n.project?'open project':count(n.id)+' recent projects'}">${n.project?`<path d="M 0 -6 L 6 0 L 0 6 L -6 0 Z" fill="${cssColor(n.color)}"/>`:`<circle r="${r}" fill="${cssColor(n.color)}"/>`}<text text-anchor="middle" y="${r+17}">${n.name}</text></g>`;}).join('');
 $('#nodes').querySelectorAll('.node').forEach(el=>{el.onpointerenter=()=>{if(!graphGesture)previewRelationships(el.dataset.id);};el.onpointerleave=()=>{if(!graphGesture)previewRelationships(null);};el.onfocus=()=>previewRelationships(el.dataset.id);el.onblur=()=>previewRelationships(null);el.onclick=e=>{if(e.detail===0)activateGraphNode(el.dataset.id);};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activateGraphNode(el.dataset.id);}};});
 $('#graph-caption').textContent='PROBLEM SPACES';
 $('.connection-key').textContent=['Spaces · Zoom in for subcategories','Subcategories · Zoom in for projects','Projects ◆ · Click to open'][renderedDetail];
 applyTransform();
}
function renderConnections(){
 if(!$('#suggestions'))return;
 const links=state.selected&&state.suggestions!==false?suggestions().filter(([a,b])=>a===state.selected||b===state.selected):[];
 $('#suggestions').innerHTML=links.length?'<div class="eyebrow">Suggested connections</div>'+links.map(([a,b,reason])=>{const id=a===state.selected?b:a;return `<div class="suggestion"><button data-follow="${id}">${label(id)} →</button><p>${reason}</p></div>`;}).join(''):state.selected?'<p class="muted">No suggested connections shown for this space.</p>':'';
 $('#suggestions').querySelectorAll('[data-follow]').forEach(b=>b.onclick=()=>{
  state.domain='';state.query='';state.tech.clear();$('#search').value='';$('#domain-filter').value='';
  const next=spaces.find(n=>n.id===b.dataset.follow);if(next.old){state.older=true;$('#older').setAttribute('aria-pressed','true');}
  state.selected=null;setSelected(next.id);
 });
 document.body.classList.toggle('space-selected',Boolean(state.selected));
}
function updateGraphLabels(){
 const occupied=[];
 const nodes=[...$('#nodes').children].sort((a,b)=>(b.dataset.id===state.selected?10000:count(b.dataset.id))-(a.dataset.id===state.selected?10000:count(a.dataset.id)));
 nodes.forEach(el=>{
  const p=positions.get(el.dataset.id),text=el.querySelector('text');
  text.style.fontSize=`${14/Math.sqrt(state.zoom)}px`;
  const box=text.getBBox(),rect={x:p.x+box.x-4,y:p.y+box.y-3,w:box.width+8,h:box.height+6};
  const collision=occupied.some(b=>rect.x<b.x+b.w&&rect.x+rect.w>b.x&&rect.y<b.y+b.h&&rect.y+rect.h>b.y);
  el.classList.toggle('crowded',collision&&el.dataset.id!==state.selected);
  if(!collision||el.dataset.id===state.selected)occupied.push(rect);
 });
}
function setupGraphControls(){
 setupGraphGestures();
 $('#domain-filter').innerHTML='<option value="">All domains</option>'+domains.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
 $('#domain-filter').onchange=e=>{state.domain=e.target.value;state.selected=null;state.panX=state.panY=0;state.zoom=1;renderGraph();renderCards();};
 $('#toggle-suggestions').onclick=()=>{state.suggestions=state.suggestions===false;$('#toggle-suggestions').setAttribute('aria-pressed',state.suggestions);renderGraph();};
}
