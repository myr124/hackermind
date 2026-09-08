// Throwaway relationship-layout experiment. Highcharts owns the force layout.
let graphChart = null;
let renderedDetail = -1;
let graphGesture = null;
let graphEdgesData = [];
let graphLayoutKey = '';

// Full-graph experiment: zoom changes only the camera, never visible detail.
function graphDetail(){return 2;}
function activateGraphNode(id){if(id.startsWith('project:'))openDetail(id.slice(8));else setSelected(id);}

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

function suggestions(){
 const links=proposedConnections.flatMap(([a,b,reason])=>(taxonomySpaceMap.get(a)||[a]).flatMap(from=>(taxonomySpaceMap.get(b)||[b]).map(to=>[from,to,reason])));
 const seen=new Set();
 return links.filter(([a,b])=>{const key=[a,b].sort().join(':');if(a===b||seen.has(key)||!spaces.some(n=>n.id===a)||!spaces.some(n=>n.id===b))return false;seen.add(key);return true;});
}
function spaceDomains(id,seen=new Set()){
 if(seen.has(id))return [];seen.add(id);
 const n=allNodes.find(n=>n.id===id);
 return n?.domain?[id]:(n?.parents||[]).flatMap(p=>spaceDomains(p,seen));
}
function graphEdges(visible){
 const ids=new Set(visible.map(n=>n.id)),edges=[];
 visible.forEach(n=>n.parents.filter(id=>ids.has(id)).forEach(id=>edges.push({from:id,to:n.id,type:'parent'})));
 // A shared project already connects its spaces through membership edges.
 // Do not add a second space-to-space edge for the same evidence.
 if(state.suggestions!==false)suggestions().forEach(([from,to,reason])=>{if(ids.has(from)&&ids.has(to))edges.push({from,to,type:'suggested',reason});});
 return edges;
}

function graphicClass(point,className,active){
 if(!point)return;
 [point.graphic,point.dataLabel].forEach(graphic=>{
  if(!graphic)return;
  if(active)graphic.addClass?.(className);else graphic.removeClass?.(className);
  graphic.element?.classList.toggle(className,active);
 });
}

function pointEdge(point){
 const custom=point?.options?.custom||{};
 if(custom.edgeKey)return graphEdgesData.find(edge=>edge.key===custom.edgeKey);
 const from=point?.options?.from||point?.from;
 const to=point?.options?.to||point?.to;
 return graphEdgesData.find(edge=>edge.from===from&&edge.to===to);
}

function previewRelationships(id){
 const related=new Set(id?[id]:[]);
 const descriptions=[];
 const series=graphChart?.series?.[0];
 const points=series?.points||[];
 graphEdgesData.forEach(edge=>{
  const active=Boolean(id)&&(edge.from===id||edge.to===id);
  const point=points.find(candidate=>pointEdge(candidate)?.key===edge.key);
  graphicClass(point,'hover-related',active);
  if(active){
   const other=edge.from===id?edge.to:edge.from;
   related.add(other);
   descriptions.push(`${label(other)} — ${edge.type==='suggested'?'suggested':edge.type==='shared'?'shared projects':edge.type==='membership'?'project membership':'subcategory'}`);
  }
 });
 series?.nodes?.forEach(node=>graphicClass(node,'hover-related',Boolean(id)&&related.has(node.id)));
 $('#graph').classList.toggle('is-hovering',Boolean(id));
 const preview=$('#graph-preview');
 preview.hidden=!id;
 preview.textContent=id?`${label(id)}\n${descriptions.length?descriptions.join('\n'):'No visible connections'} `:'';
}

function updateGraphState(){
 const series=graphChart?.series?.[0];
 if(!series)return;
 const neighbors=new Set(state.selected?[state.selected]:[]);
 graphEdgesData.forEach(edge=>{
  if(edge.from===state.selected||edge.to===state.selected){neighbors.add(edge.from);neighbors.add(edge.to);}
 });
 const matches=state.query.trim()?new Set(filtered().flatMap(p=>p.spaces)):null;
 series.nodes?.forEach(node=>{
  const id=node.id;
  graphicClass(node,'project-node',Boolean(node.options.custom?.project));
  graphicClass(node,'subcategory-node',Boolean(node.options.custom?.child));
  graphicClass(node,'space-node',!node.options.custom?.project&&!node.options.custom?.child);
  graphicClass(node,'selected',id===state.selected);
  graphicClass(node,'dim',Boolean(state.selected)&&!neighbors.has(id)||Boolean(matches)&&!matches.has(id));
 });
 series.points?.forEach(point=>{
  const edge=pointEdge(point);
  if(!edge)return;
  graphicClass(point,edge.type,true);
  graphicClass(point,'selected',Boolean(state.selected)&&(edge.from===state.selected||edge.to===state.selected));
  graphicClass(point,'dim',Boolean(state.selected)&&edge.from!==state.selected&&edge.to!==state.selected);
 });
}

function graphPointTarget(target){return target.closest?.('.highcharts-point,.highcharts-link,.highcharts-data-label');}
function setupGraphGestures(){
 const stage=$('.graph-stage');
 const preview=document.createElement('div');
 preview.id='graph-preview';
 preview.hidden=true;
 preview.className='graph-preview';
 stage.append(preview);
 stage.addEventListener('wheel',event=>{
  event.preventDefault();
  if(graphGesture)return;
  const rect=stage.getBoundingClientRect();
  const center={x:rect.width/2,y:rect.height/2};
  const pointer={x:event.clientX-rect.left,y:event.clientY-rect.top};
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?rect.height:1);
  const current=state.zoom;
  const next=Math.max(.6,Math.min(6,current*Math.exp(-delta*.0015)));
  const ratio=next/current;
  state.panX=pointer.x-center.x-(pointer.x-center.x-state.panX)*ratio;
  state.panY=pointer.y-center.y-(pointer.y-center.y-state.panY)*ratio;
  state.zoom=next;
  applyGraphTransform();
 },{passive:false});
 stage.addEventListener('pointerdown',event=>{
  if(event.button!==0||graphGesture||graphPointTarget(event.target))return;
  graphGesture={pointer:event.pointerId,startX:event.clientX,startY:event.clientY,panX:state.panX,panY:state.panY,moved:false};
  stage.setPointerCapture(event.pointerId);
  stage.classList.add('is-dragging');
 });
 stage.addEventListener('pointermove',event=>{
  const gesture=graphGesture;
  if(!gesture||gesture.pointer!==event.pointerId)return;
  if(Math.hypot(event.clientX-gesture.startX,event.clientY-gesture.startY)>4)gesture.moved=true;
  if(!gesture.moved)return;
  state.panX=gesture.panX+event.clientX-gesture.startX;
  state.panY=gesture.panY+event.clientY-gesture.startY;
  applyGraphTransform(false);
 });
 function end(event){
  if(!graphGesture||graphGesture.pointer!==event.pointerId)return;
  graphGesture=null;
  stage.classList.remove('is-dragging');
  if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);
  previewRelationships(null);
 }
 stage.addEventListener('pointerup',end);
 stage.addEventListener('pointercancel',end);
 stage.addEventListener('lostpointercapture',end);
}

function renderGraph(){
 if($('#graph-preview'))previewRelationships(null);
 const mobile=matchMedia('(max-width:750px)').matches;
 const detail=graphDetail();
 renderedDetail=detail;
 let visible=spaces.filter(n=>(!n.child||detail>=1||!state.collapsed&&n.id===state.selected)&&(!n.old||state.older)&&(!state.domain||spaceDomains(n.id).includes(state.domain)));
 const edges=graphEdges(visible);
 const spaceIds=new Set(visible.map(n=>n.id));
 if(detail===2)projects.forEach(project=>{
  const parents=project.spaces.filter(id=>spaceIds.has(id));
  if(!parents.length)return;
  const id='project:'+project.id;
  visible.push({id,name:project.name,project:true,parents,color:spaces.find(n=>n.id===parents[0]).color});
  parents.forEach(from=>edges.push({from,to:id,type:'membership'}));
 });
 const layoutKey=JSON.stringify([mobile,state.theme,state.suggestions,visible.map(n=>n.id)]);
 if(graphChart&&layoutKey===graphLayoutKey){updateGraphState();applyGraphTransform();return;}
 graphLayoutKey=layoutKey;
 graphEdgesData=edges.map((edge,index)=>({...edge,key:`edge-${index}`}));
 const graph=$('#graph');
 graph.classList.remove('is-hovering','is-dragging');
 graph.style.transform='none';
 if(graphChart)graphChart.destroy();
 graphChart=null;
 graph.innerHTML='';
 const networkGraphType=window.Highcharts?.seriesTypes?.networkgraph||window.Highcharts?.Series?.types?.networkgraph;
 if(!networkGraphType){
  graph.textContent='Highcharts Network Graph is unavailable. Reload the prototype with network access.';
  return;
 }
 const textColor=cssColor('text'),panelColor=cssColor('panel'),lineColor=cssColor('line'),aquaColor=cssColor('aqua');
 const nodeOptions=visible.map(node=>({
  id:node.id,
  name:node.name,
  color:cssColor(node.color),
  className:node.project?'project-node':node.child?'subcategory-node':'space-node',
  marker:{
   radius:node.project?3:node.child?5+Math.sqrt(count(node.id)):10+Math.sqrt(count(node.id))*2.5,
   symbol:node.project?'diamond':'circle',
   lineColor:panelColor,
   lineWidth:2
  },
  custom:{project:Boolean(node.project),child:Boolean(node.child),count:count(node.id)}
 }));
 const linkData=graphEdgesData.map(edge=>({
  id:edge.key,
  from:edge.from,
  to:edge.to,
  color:edge.type==='suggested'?aquaColor:lineColor,
  dashStyle:edge.type==='suggested'?'Dash':'Solid',
  lineWidth:edge.type==='suggested'?1.2:1.3,
  className:`edge ${edge.type}`,
  custom:{edgeKey:edge.key}
 }));
 graphChart=Highcharts.chart('graph',{
  chart:{
   type:'networkgraph',
   backgroundColor:'transparent',
   animation:false,
   spacing:[mobile?140:145,24,mobile?210:65,24],
   style:{fontFamily:'ui-monospace, SFMono-Regular, Consolas, Liberation Mono, monospace'}
  },
  title:{text:null},
  credits:{enabled:false},
  legend:{enabled:false},
  tooltip:{enabled:false},
  accessibility:{
   enabled:true,
   point:{descriptionFormatter:point=>{
    const custom=point.options?.custom||{};
    return `${point.name||point.id}, ${custom.project?'open project':`${custom.count||0} recent projects`}`;
   }}
  },
  plotOptions:{
   series:{animation:false,states:{hover:{enabled:false},inactive:{opacity:1}}},
   networkgraph:{
    draggable:true,
    enableMouseTracking:true,
    inactiveOtherPoints:false,
    lineWidth:1.3,
    link:{color:lineColor,width:1.3},
    dataLabels:{
     enabled:true,
     allowOverlap:false,
     padding:0,
     linkFormat:'',
     formatter:function(){return this.point?.options?.custom?.edgeKey?'':this.point?.name||'';},
     style:{color:textColor,fontSize:'11px',fontWeight:'400',textOutline:`5px ${panelColor}`}
    },
    layoutAlgorithm:{
     type:'reingold-fruchterman',
     // Finite-range repulsion prevents disconnected spaces being pushed
     // against the plot boundary by the default Euler integration.
     integration:'verlet',
     gravitationalConstant:0.15,
     initialPositionRadius:100,
     enableSimulation:true,
     initialPositions:function(){
      const cx=this.box.width/2,cy=this.box.height/2;
      const radius=Math.max(50,Math.min(cx,cy)-45);
      this.nodes.forEach((node,i)=>{
       const angle=i*2.399963,spread=radius*.85*Math.sqrt((i+.5)/this.nodes.length);
       node.plotX=node.prevX=cx+Math.cos(angle)*spread;
       node.plotY=node.prevY=cy+Math.sin(angle)*spread;
      });
      const byId=new Map(this.nodes.map(n=>[n.id,n]));
      const roots=visible.filter(n=>!n.project&&!n.child);
      roots.forEach((n,i)=>{
       const node=byId.get(n.id),a=i*2.399963,r=radius*.8*Math.sqrt((i+.5)/roots.length);
       node.plotX=node.prevX=cx+Math.cos(a)*r;node.plotY=node.prevY=cy+Math.sin(a)*r;
      });
      visible.filter(n=>n.child||n.project).forEach((n,i)=>{
       const node=byId.get(n.id),parents=n.parents.map(id=>byId.get(id)).filter(Boolean);
       if(!node||!parents.length)return;
       node.plotX=node.prevX=parents.reduce((s,p)=>s+p.plotX,0)/parents.length+Math.cos(i*2.399963)*24;
       node.plotY=node.prevY=parents.reduce((s,p)=>s+p.plotY,0)/parents.length+Math.sin(i*2.399963)*24;
      });
      // Constrain the simulation itself to a disk, rather than clipping nodes.
      this.applyLimitBox=function(node){
       const x=this.box.width/2,y=this.box.height/2;
       const limit=Math.max(20,Math.min(x,y)-45-(node.radius||0));
       const dx=node.plotX-x,dy=node.plotY-y,d=Math.hypot(dx,dy);
       if(d>limit){node.plotX=x+dx/d*limit;node.plotY=y+dy/d*limit;}
      };
     },
     linkLength:55,
     maxIterations:500
    },
    point:{events:{
     click:function(){if(this.isNode)activateGraphNode(this.id);},
     mouseOver:function(){
      const id=this.isNode?this.id:pointEdge(this)?.from;
      if(id)previewRelationships(id);
     },
     mouseOut:function(){previewRelationships(null);},
     dragStart:function(){$('#graph').classList.add('is-dragging');},
     drop:function(){$('#graph').classList.remove('is-dragging');}
    }}
   }
  },
  series:[{id:'problem-space-network',type:'networkgraph',data:linkData,nodes:nodeOptions}]
 });
 updateGraphState();
 $('#graph-caption').textContent='PROBLEM SPACES';
 $('.connection-key').textContent=state.suggestions?'Solid: subcategory or membership · Dashed: suggested':'Spaces → Subcategories → Projects · Hover to trace';
 applyGraphTransform();
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

function applyGraphTransform(refreshState=true){
 if(renderedDetail!==graphDetail()){renderGraph();return;}
 const graph=$('#graph');
 if(graph){
  graph.classList.toggle('show-subcategories',state.zoom>=1.5);
  graph.classList.toggle('show-projects',state.zoom>=2.4);
  graph.style.transformOrigin='50% 50%';
  graph.style.transform=`translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;
  graph.style.willChange=state.zoom===1&&state.panX===0&&state.panY===0?'auto':'transform';
 }
 if(refreshState){updateGraphState();renderState();}
}

function setupGraphControls(){
 setupGraphGestures();
 $('#toggle-suggestions').setAttribute('aria-pressed',state.suggestions);
 $('#domain-filter').innerHTML='<option value="">All domains</option>'+domains.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
 $('#domain-filter').onchange=e=>{state.domain=e.target.value;state.selected=null;state.panX=state.panY=0;state.zoom=1;renderGraph();renderCards();};
 $('#toggle-suggestions').onclick=()=>{state.suggestions=state.suggestions===false;$('#toggle-suggestions').setAttribute('aria-pressed',state.suggestions);renderGraph();};
}
