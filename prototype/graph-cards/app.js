// THROWAWAY UI ONLY. Fictional projects, keyword search, in-memory saves. No ingestion, AI, accounts, or persistence.
const $ = (q) => document.querySelector(q);
const domains = [
  {id:'environment',name:'Environment',color:'aqua',x:230,y:165,domain:true},
  {id:'creative',name:'Creative tools',color:'orange',x:520,y:245,domain:true},
  {id:'developer',name:'Developer tools',color:'blue',x:770,y:155,domain:true},
  {id:'wellbeing',name:'Wellbeing',color:'purple',x:785,y:320,domain:true}
];
const spaces = [
  {id:'wildlife',name:'Wildlife observation',color:'aqua',x:125,y:100,parents:['environment']},
  {id:'gardening',name:'Urban growing',color:'aqua',x:160,y:285,parents:['environment']},
  {id:'energy',name:'Home energy',color:'aqua',x:365,y:100,parents:['environment']},
  {id:'music',name:'Music making',color:'orange',x:430,y:340,parents:['creative']},
  {id:'visual',name:'Visual expression',color:'orange',x:520,y:100,parents:['creative']},
  {id:'worlds',name:'World building',color:'orange',x:625,y:330,parents:['creative']},
  {id:'local',name:'Local knowledge search',color:'blue',x:695,y:70,parents:['developer']},
  {id:'debug',name:'Debugging workflows',color:'blue',x:890,y:135,parents:['developer']},
  {id:'focus',name:'Focus & attention',color:'purple',x:895,y:280,parents:['wellbeing']},
  {id:'birds',name:'Bird identification',color:'aqua',x:70,y:185,parents:['wildlife'],child:true},
  {id:'synth',name:'Sound synthesis',color:'orange',x:330,y:365,parents:['music'],child:true},
  {id:'notes',name:'Searching personal notes',color:'blue',x:840,y:60,parents:['local'],child:true},
  {id:'archives',name:'Digital preservation',color:'blue',x:965,y:210,parents:['developer'],old:true}
];
const largeSample=new URLSearchParams(location.search).get('dataset')!=='small';
if(largeSample){domains.push(...scaleDomains);spaces.push(...scaleSpaces);}
const allNodes=[...domains,...spaces];
const projects=[
 {id:'canopy',name:'Canopy',desc:'A tiny listening station that turns backyard birdsong into a living field journal.',source:'GitHub',date:'2026-09-04',tags:['Python','Computer vision'],spaces:['birds'],art:'bird',label:'LISTEN TO YOUR BACKYARD',detail:'A solar-powered field recorder pairs on-device audio recognition with a simple observation journal. An idea for making the natural world around you a little more visible.'},
 {id:'patchwork',name:'Patchwork',desc:'Build little instruments. Connect them together. Get wonderfully lost in sound.',source:'Show HN',date:'2026-09-03',tags:['Web Audio','TypeScript'],spaces:['synth'],art:'synth',label:'A PLAYGROUND FOR SOUND',detail:'A browser-based modular synth built around small, approachable sound modules. Connect oscillators, filters, and sequencers into an instrument that is entirely yours.'},
 {id:'moss',name:'Moss',desc:'An unhurried world-building game where every small garden tells a story.',source:'itch.io',date:'2026-09-02',tags:['Godot'],spaces:['worlds','gardening'],art:'garden',label:'SMALL WORLDS, SLOW DAYS',detail:'A cozy procedural gardening game. Place paths, plant tiny forests, and watch a quiet landscape find its own shape. Connects creative world building with urban growing.'},
 {id:'lumen',name:'Lumen',desc:'A local-first search engine for the scattered notes you thought you’d lost.',source:'Product Hunt',date:'2026-09-01',tags:['Rust','Local AI'],spaces:['notes'],art:'terminal',label:'YOUR NOTES. CONNECTED.',detail:'A private notebook search tool that brings related snippets together without uploading your writing. A starting point for exploring personal information retrieval.'},
 {id:'fieldkit',name:'Fieldkit',desc:'A pocket-sized dashboard for the light, soil, and small needs of your plants.',source:'GitHub',date:'2026-08-30',tags:['Python','Hardware'],spaces:['gardening'],art:'sensor',label:'GROW SOMETHING GOOD',detail:'Low-cost environmental sensors paired with a local dashboard. Designed for window boxes and small growing spaces rather than industrial agriculture.'},
 {id:'afterimage',name:'Afterimage',desc:'Turn ordinary camera movement into unexpected, painterly visual sketches.',source:'Hugging Face Spaces',date:'2026-08-28',tags:['Python','Computer vision'],spaces:['visual'],art:'vision',label:'MOVEMENT BECOMES MATERIAL',detail:'An interactive camera experiment using motion as a brush. Explores how a small vision model can enable expressive tools without a complicated creative workflow.'},
 {id:'trace',name:'Trace',desc:'Follow a request through your services without getting buried in the noise.',source:'GitHub',date:'2026-08-25',tags:['Rust','TypeScript'],spaces:['debug'],art:'trace',label:'FOLLOW THE SIGNAL',detail:'A compact request tracing interface that organizes logs around the path of one request. A project for developers who want debugging to feel more like following a story.'},
 {id:'still',name:'Still',desc:'A gentle focus timer that creates a small clearing in your working day.',source:'Product Hunt',date:'2026-08-22',tags:['TypeScript'],spaces:['focus'],art:'timer',label:'ONE THING AT A TIME',detail:'A minimal focus companion with quiet breaks and no competitive streaks. Explores supportive interaction patterns for attention and daily pacing.'},
 {id:'watt',name:'Watt’s happening',desc:'Make sense of household energy with a friendly, entirely local monitor.',source:'Show HN',date:'2026-08-18',tags:['Hardware','Python'],spaces:['energy'],art:'energy',label:'SEE YOUR EVERYDAY ENERGY',detail:'A home energy monitor that transforms sensor readings into clear everyday patterns. Runs on a small local device and invites experimentation with useful physical interfaces.'},
 {id:'archive',name:'Memory garden',desc:'A small personal archive that makes old web pages feel discoverable again.',source:'GitHub',date:'2025-11-12',tags:['Rust'],spaces:['archives'],art:'terminal',label:'KEEP THE GOOD PARTS',detail:'An older project for preserving and exploring personal web collections. It is intentionally outside the recent window to demonstrate older-space browsing.'}
];
if(largeSample)projects.push(...scaleProjects);
const names={A:'Problem Spaces',C:'Recently Added'};
const descriptions={A:'Explore the map. Follow a connection.',C:'Browse the builds. Collect inspiration.'};
const params=new URLSearchParams(location.search);
const state={variant:names[params.get('variant')]?params.get('variant'):'A',selected:null,domain:'',suggestions:true,query:'',tech:new Set(),saved:new Set(),mode:'explore',older:false,expanded:false,theme:'dark',mobile:'graph',zoom:1,panX:0,panY:0};
let opened=null,returnFocus=null,frame=0,drag=null,moved=false,toastTimer;
const recent=p=>p.date>='2026-06-07' && p.date<='2026-09-05';
function descendantIds(id){const found=new Set([id]);let changed=true;while(changed){changed=false;for(const n of spaces)if(n.parents.some(p=>found.has(p))&&!found.has(n.id)){found.add(n.id);changed=true;}}return found;}
function members(id){const ids=descendantIds(id);return projects.filter(p=>p.spaces.some(s=>ids.has(s)));}
function count(id){return members(id).filter(recent).length;}
function label(id){return id?.startsWith('project:')?projects.find(p=>p.id===id.slice(8))?.name||'Project':allNodes.find(n=>n.id===id)?.name||'All spaces';}
function cssColor(name){return getComputedStyle(document.documentElement).getPropertyValue('--'+name).trim();}
function art(p){
 const begin=`<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="200" fill="#071112"/>`;
 const end=`</svg><span class="art-label">${p.label}</span>`;
 let s='';
 if(p.art==='bird')s=`<circle cx="233" cy="43" r="82" fill="#143237"/><circle cx="235" cy="43" r="59" fill="none" stroke="#49747d"/><path d="M0 143 Q90 90 180 140 T340 104 V200 H0" fill="#102328"/><path d="M34 148 L285 125 M129 141 L152 154" stroke="#69858c" stroke-width="4"/><path d="M149 137 C123 131 122 101 146 93 C149 74 170 71 178 86 L193 92 L177 97 C175 123 165 137 149 137Z" fill="#e0e0e0"/><path d="M144 103 Q105 94 94 67 Q149 77 162 112" fill="#ffdf38"/><circle cx="167" cy="86" r="3" fill="#071112"/><path d="M152 136 L150 142 M160 134 L161 140" stroke="#e0e0e0" stroke-width="2"/><path d="M214 78 q15 12 0 24 M224 70 q23 20 0 40" fill="none" stroke="#00e5ff" stroke-width="2"/>`;
 if(p.art==='synth')s=`<rect x="28" y="29" width="264" height="129" rx="7" fill="#24363e" stroke="#49616b"/>${[0,1,2,3,4,5].map((v)=>`<rect x="${39+v*41}" y="39" width="34" height="108" rx="2" fill="${v%2?'#101c22':'#344952'}"/><circle cx="${56+v*41}" cy="60" r="9" fill="#000b0b" stroke="#8ca6b3"/><path d="M${56+v*41} 60v-7" stroke="#ffdf38"/><circle cx="${56+v*41}" cy="106" r="4" fill="#00e5ff"/>`).join('')}<path d="M56 106 C60 178 216 169 220 106 M97 106 C130 48 272 168 261 106 M138 106 C135 153 183 154 179 106" fill="none" stroke="#ae8cff" stroke-width="3"/><path d="M96 106 Q140 171 219 106" fill="none" stroke="#ffdf38" stroke-width="3"/>`;
 if(p.art==='garden')s=`<rect width="320" height="200" fill="#0c2429"/><circle cx="267" cy="39" r="19" fill="#ffdf38"/><path d="M-30 171 L133 65 L334 167 L175 242Z" fill="#24595e"/><path d="M1 170 L135 85 L301 167 L172 222Z" fill="#397a77"/><path d="M72 193 L149 143 L214 174 L243 155" fill="none" stroke="#9cbec4" stroke-width="18"/>${[[81,135],[119,109],[205,139],[257,163],[151,177]].map(([x,y])=>`<rect x="${x-2}" y="${y-15}" width="5" height="28" fill="#37545c"/><path d="M${x-20} ${y} l20 -40 l20 40Z" fill="#174649"/><path d="M${x-15} ${y-15} l15 -30 l15 30Z" fill="#2c6869"/>`).join('')}<path d="M152 126 l27 -17 l28 17 v23 l-28 17 l-27 -17Z" fill="#789fa9"/><path d="M147 127 l31 -29 l35 28 l-35 19Z" fill="#00a0b4"/>`;
 if(p.art==='terminal')s=`<rect x="27" y="25" width="266" height="137" rx="5" fill="#000b0b" stroke="#36545d"/><path d="M27 47H293" stroke="#36545d"/><circle cx="40" cy="36" r="3" fill="#ff2e2e"/><circle cx="51" cy="36" r="3" fill="#ffdf38"/><circle cx="62" cy="36" r="3" fill="#ffdf38"/><g fill="#00e5ff" font-family="monospace" font-size="10"><text x="42" y="68">~/thoughts $ find a connection</text><text x="42" y="91" fill="#e0e0e0">↳ something you almost forgot</text><text x="42" y="112" fill="#8ca6b3">  3 related fragments found</text><text x="42" y="140">&gt; _</text></g><path d="M224 97 l15 -17 l28 26 l-19 23Z" fill="none" stroke="#ffdf38"/><circle cx="224" cy="97" r="4" fill="#ffdf38"/>`;
 if(p.art==='sensor')s=`<rect width="320" height="200" fill="#0d2429"/><path d="M39 200 Q22 88 71 22 M281 200 Q290 100 247 24" fill="none" stroke="#437079" stroke-width="2"/>${[40,75,110].map(y=>`<ellipse cx="54" cy="${y}" rx="9" ry="25" fill="#215057" transform="rotate(-35 54 ${y})"/>`).join('')}<rect x="99" y="38" width="124" height="115" rx="13" fill="#9bb0b8"/><rect x="111" y="50" width="100" height="70" rx="4" fill="#12252b"/><text x="122" y="81" fill="#ffdf38" font-size="24" font-family="monospace">24.6°</text><text x="122" y="104" fill="#ffdf38" font-size="9" font-family="monospace">SOIL 68% / GOOD</text><circle cx="162" cy="137" r="6" fill="#38525c"/>`;
 if(p.art==='vision')s=`<rect width="320" height="200" fill="#101c22"/>${Array.from({length:15},(_,i)=>`<ellipse cx="${75+i*12}" cy="${88+Math.sin(i*.6)*23}" rx="${25+i*2}" ry="${65-i*2}" fill="none" stroke="${['#ae8cff','#00e5ff','#ffdf38','#00e5ff'][i%4]}" opacity=".7" transform="rotate(${i*8} ${75+i*12} 100)"/>`).join('')}<path d="M22 47V25H45 M277 25h22v22 M299 144v22h-22 M45 166H22v-22" fill="none" stroke="#e0e0e0" stroke-width="1"/>`;
 if(p.art==='trace')s=`<rect width="320" height="200" fill="#071112"/>${[0,1,2,3,4].map(i=>`<path d="M30 ${50+i*22}H290" stroke="#263d45"/>`).join('')}<path d="M35 116H75V63H121V95H166V43H212V119H279" fill="none" stroke="#00e5ff" stroke-width="3"/>${[[75,63],[121,95],[166,43],[212,119]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6" fill="#071112" stroke="#ffdf38" stroke-width="2"/>`).join('')}<text x="34" y="155" font-family="monospace" font-size="9" fill="#8ca6b3">request_084 → 4 spans → 23ms</text>`;
 if(p.art==='timer')s=`<rect width="320" height="200" fill="#101c22"/><circle cx="160" cy="88" r="58" fill="none" stroke="#314b52"/><circle cx="160" cy="88" r="58" fill="none" stroke="#ffdf38" stroke-width="3" stroke-dasharray="260 365" transform="rotate(-90 160 88)"/><text x="160" y="95" text-anchor="middle" font-family="monospace" font-size="28" fill="#e0e0e0">24:59</text><text x="160" y="117" text-anchor="middle" font-family="monospace" font-size="8" letter-spacing="2" fill="#8ca6b3">ROOM TO THINK</text>`;
 if(p.art==='energy')s=`<rect width="320" height="200" fill="#101c22"/>${[36,50,40,69,80,55,43,63,97,70,51,32].map((h,i)=>`<rect x="${35+i*21}" y="${150-h}" width="12" height="${h}" rx="2" fill="${i===8?'#ffdf38':'#42767e'}"/>`).join('')}<text x="35" y="36" font-family="monospace" font-size="12" fill="#e0e0e0">a quieter kind of power.</text><path d="M32 153H293" stroke="#8ca6b3"/>`;
 return begin+s+end;
}
function filtered(){let p=[...projects];if(state.domain)p=p.filter(x=>x.spaces.some(id=>spaceDomains(id).includes(state.domain)));if(state.mode==='saved')p=p.filter(x=>state.saved.has(x.id));else if(!state.selected&&!state.query.trim())p=p.filter(recent);if(state.selected){const ids=new Set(members(state.selected).map(x=>x.id));p=p.filter(x=>ids.has(x.id));}if(state.tech.size)p=p.filter(x=>x.tags.some(t=>state.tech.has(t)));const q=state.query.trim().toLowerCase();if(q)p=p.filter(x=>[x.name,x.desc,x.detail,...x.tags,...x.spaces.map(label)].join(' ').toLowerCase().includes(q));return p.sort((a,b)=>b.date.localeCompare(a.date));}
function renderCards(){
 const list=filtered();
 $('#feed-title').textContent=state.mode==='saved'?'Your saved starting points':state.selected?label(state.selected):state.query?'Search results':'Recently published';
 $('#feed-subtitle').textContent=`${list.length} project${list.length===1?'':'s'}${state.selected?' in this space and its subcategories':''}${state.tech.size?' · '+[...state.tech].join(' or '):''}${state.query?' · matching “'+state.query+'”':''} · fictional sample`;
 $('#cards').innerHTML=list.length?list.map(p=>`<article class="card"><button class="card-open" data-open="${p.id}" aria-label="View ${p.name}"><div class="art">${art(p)}</div><div class="card-body"><h3>${p.name}</h3><p>${p.desc}</p></div></button><div class="card-footer"><span>${label(p.spaces[0])}</span><button class="save" data-save="${p.id}" aria-pressed="${state.saved.has(p.id)}" aria-label="${state.saved.has(p.id)?'Unsave':'Save'} ${p.name}">${state.saved.has(p.id)?'★ Saved':'☆ Save'}</button></div></article>`).join(''):`<div class="empty"><div aria-hidden="true">[ . . . ]</div><h3>No projects here yet.</h3><p>Try another path through the sample collection.</p><button data-clear>Search all projects</button></div>`;
 $('#cards').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openDetail(b.dataset.open));
 $('#cards').querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>toggleSave(b.dataset.save));
 $('[data-clear]')?.addEventListener('click',reset);
 $('#saved-count').textContent=state.saved.size;$('#saved-mobile span').textContent=state.saved.size;
 renderState();
}
function toggleSave(id){const saving=!state.saved.has(id);saving?state.saved.add(id):state.saved.delete(id);renderCards();if(opened)renderDetail();$('#toast').textContent=saving?'Saved for this prototype session.':'Removed from session saves.';$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,2200);}
function openDetail(id){returnFocus=document.activeElement;opened=id;renderDetail();$('#drawer').hidden=false;document.body.style.overflow='hidden';$('#close-detail').focus();}
function renderDetail(){const p=projects.find(x=>x.id===opened);$('#detail').innerHTML=`<div class="art">${art(p)}</div><div class="eyebrow">${p.source} / SAMPLE PROJECT</div><h2 id="detail-title">${p.name}</h2><p>${p.detail}</p><div class="tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="detail-facts"><div class="fact"><span>Published</span><span>${p.date}</span></div><div class="fact"><span>Date evidence</span><span>${['GitHub','Hugging Face Spaces'].includes(p.source)?'Repository-created fallback':'Announcement date'}</span></div><div class="fact"><span>Problem spaces</span><span>${p.spaces.map(label).join(', ')}</span></div><div class="fact"><span>Source</span><span>${p.source} · fictional fixture</span></div></div><button class="detail-save" id="detail-save">${state.saved.has(p.id)?'★ Remove from saved projects':'☆ Save this starting point'}</button><p class="notice">Prototype only: this is an invented project, not a live listing. Saves last for this page session. No account or board is created.</p>`;$('#detail-save').onclick=()=>toggleSave(p.id);}
function closeDetail(){$('#drawer').hidden=true;document.body.style.overflow='';opened=null;if(returnFocus?.isConnected)returnFocus.focus();else $('#search').focus();}
$('#close-detail').onclick=closeDetail;$('#drawer').onclick=e=>{if(e.target===$('#drawer'))closeDetail();};
function setSelected(id){state.selected=state.selected===id?null:id;state.mode='explore';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));renderGraph(false);renderCards();renderIndex();}
function renderIndex(){$('#domain-index').innerHTML=`<button class="domain-nav ${!state.selected?'active':''}" data-domain="">All domains <span>${String(domains.length).padStart(2,'0')}</span></button>`+domains.map(d=>`<button class="domain-nav ${state.selected===d.id?'active':''}" data-domain="${d.id}">${d.name} <span>${String(count(d.id)).padStart(2,'0')}</span></button>`).join('');$('#domain-index').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!b.dataset.domain){state.selected=null;renderGraph(false);renderCards();renderIndex();}else setSelected(b.dataset.domain);});}
function applyTransform(){if(renderedDetail!==graphDetail()){renderGraph();return;}const cx=graphWidth/2,cy=graphHeight/2;$('#viewport').setAttribute('transform',`translate(${state.panX} ${state.panY}) translate(${cx} ${cy}) scale(${state.zoom}) translate(${-cx} ${-cy})`);updateGraphLabels();renderState();}
function zoom(change){state.zoom=Math.max(.6,Math.min(6,state.zoom+change));applyTransform();}
$('#zoom-in').onclick=()=>zoom(.2);$('#zoom-out').onclick=()=>zoom(-.2);$('#zoom-fit').onclick=()=>{state.zoom=1;state.panX=0;state.panY=0;applyTransform();};
function renderFilters(){const tags=['Python','Computer vision','Local AI','Hardware','Rust'];$('#filters').innerHTML='<span class="filter-label">TECHNOLOGIES</span>'+tags.map(t=>`<button data-tech="${t}" aria-pressed="${state.tech.has(t)}">${t}</button>`).join('');$('#filters').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.tech.has(b.dataset.tech)?state.tech.delete(b.dataset.tech):state.tech.add(b.dataset.tech);renderFilters();renderCards();});}
function reset(){state.selected=null;state.domain='';$('#domain-filter').value='';state.query='';state.tech.clear();state.mode='explore';$('#search').value='';renderFilters();renderCards();renderGraph(false);renderIndex();document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode==='explore'));}
$('#reset').onclick=reset;$('#search').oninput=e=>{state.query=e.target.value;renderCards();renderGraph(false);};
$('#older').onclick=()=>{state.older=!state.older;$('#older').setAttribute('aria-pressed',state.older);renderGraph();renderState();};
$('#expand').onclick=()=>{state.expanded=!state.expanded;$('#expand').setAttribute('aria-pressed',state.expanded);$('#expand').textContent=state.expanded?'Collapse subcategories −':'Expand subcategories +';renderGraph();renderState();};
$('#theme').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=state.theme;$('#theme span').textContent=state.theme==='dark'?'Light':'Dark';$('#theme').setAttribute('aria-label',`Switch to ${state.theme==='dark'?'light':'dark'} theme`);renderGraph(false);renderState();};
function setMode(mode){state.mode=mode;state.selected=null;state.domain='';$('#domain-filter').value='';state.query='';state.tech.clear();$('#search').value='';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));if(mode==='saved'){state.variant='C';setVariant();}renderCards();renderFilters();renderGraph(false);renderIndex();}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));$('#saved-mobile').onclick=()=>setMode(state.mode==='saved'?'explore':'saved');
function setMobile(view){state.mobile=view;document.body.classList.toggle('mobile-graph',view==='graph');document.body.classList.toggle('mobile-projects',view==='projects');$('#tab-graph').setAttribute('aria-pressed',view==='graph');$('#tab-projects').setAttribute('aria-pressed',view==='projects');renderState();}
$('#tab-graph').onclick=()=>setMobile('graph');$('#tab-projects').onclick=()=>setMobile('projects');
function renderState(){
 renderConnections();
 const result=filtered();
 $('#focus-title').textContent=state.selected?label(state.selected):state.query?'Follow the matches.':'Follow your curiosity.';
 $('#focus-copy').textContent=state.selected?`${count(state.selected)} recent / ${members(state.selected).length} total · ${result.length} matching projects`:`${domains.length} domains · ${spaces.length} spaces · ${result.length} matching projects · fictional sample`;
 $('#browse-projects').textContent=`Browse ${result.length} project${result.length===1?'':'s'} →`;
 $('#clear-space').hidden=!state.selected;
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.variant&&state.mode!=='saved'));
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
}
function snapshot(){return {...state,dataset:largeSample?'large':'small',catalog:{domains:domains.length,spaces:spaces.length,projects:projects.length},tech:[...state.tech],saved:[...state.saved],visibleProjects:filtered().map(p=>p.id),data:'fictional',search:'keyword-only'};}
function setVariant(){
 document.body.classList.remove('variant-A','variant-B','variant-C');document.body.classList.add('variant-'+state.variant);
 const url=new URL(location.href);url.searchParams.set('variant',state.variant);history.replaceState(null,'',url);
 $('#hero-title').innerHTML=state.variant==='A'?'A world of things being built<span class="green">.</span>':'A field guide to possibility<span class="green">.</span>';
 $('#hero-copy').textContent=state.variant==='A'?'Follow a connection. Find your next direction.':'Interesting builds, unexpected connections, and your next starting point.';
 $('#search').placeholder=state.variant==='A'?'Find a direction…':'Search projects, problems, or technologies';
 renderState();console.info('PROTOTYPE STATE',snapshot());
}
function changeView(view){state.variant=view;state.mode='explore';setVariant();renderCards();window.scrollTo(0,0);}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>changeView(b.dataset.view));
$('#browse-projects').onclick=()=>changeView('C');$('#clear-space').onclick=reset;
document.addEventListener('keydown',e=>{
 if(!$('#drawer').hidden){if(e.key==='Escape')closeDetail();if(e.key==='Tab'){const focusables=[...$('.drawer-panel').querySelectorAll('button,[href],input,[tabindex="0"]')];const first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}
 if(e.target.closest('input,textarea,select,[contenteditable]'))return;
 if(e.key==='/'){e.preventDefault();$('#search').focus();}
});
setupGraphControls();setMobile('graph');renderFilters();renderIndex();renderCards();renderGraph();setVariant();
window.prototypeState=snapshot;

matchMedia('(max-width:750px)').addEventListener('change',()=>{positions.clear();state.zoom=1;state.panX=state.panY=0;renderGraph(false);});
