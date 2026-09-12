"use client";
import { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { NodeSquareProgram } from "@sigma/node-square";
import { constellation, type GraphData, type GraphNode, type Position } from "../lib/constellation";

type Props = { selected: number | null; light: boolean; visible: boolean; domains: {id:number;name:string}[]; onSelect: (id: number | null) => void; onProject: (id: number) => void; onBrowse: () => void };
export default function Network(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const renderer = useRef<Sigma | null>(null);
  const latest = useRef(props); latest.current = props;
  const positions = useRef(new Map<string,Position>());
  const camera = useRef({x:.5,y:.5,angle:0,ratio:1});
  const [data,setData] = useState<GraphData | null>(null);
  const [error,setError] = useState("");
  const [older,setOlder] = useState(false);
  const [domain,setDomain] = useState("");
  const [technology,setTechnology] = useState("");
  const [hover,setHover] = useState<string | null>(null);
  const [ratio,setRatio] = useState(1);
  const [nodeChoice,setNodeChoice] = useState("");
  const domainColor = (id:number) => (props.light?["#007d91","#846700","#6c4aa5","#a74456"]:["#00cee8","#ffdf38","#bda0ff","#ffa2b4"])[id%4];
  const state = useRef({older,domain,technology,hover,ratio}); state.current = {older,domain,technology,hover,ratio};
  async function load(focus?: number) { setError(""); try {const r=await fetch(`/api/graph${focus ? `?space_id=${focus}` : ""}`);if(!r.ok)throw new Error();setData(await r.json());}catch {setError("The graph could not load. Retry to reconnect.");} }
  useEffect(() => { void load(); },[]);
  const activate = (node: GraphNode) => { setNodeChoice(node.id); if(node.kind === "space")latest.current.onSelect(node.entity_id);else latest.current.onProject(node.entity_id); };
  useEffect(() => {
    if(!container.current || !data) return;
    let sigma: Sigma;
    const graph = new Graph();
    const placed = constellation(data);
    data.nodes.forEach(node => {
      const p=positions.current.get(node.id) || placed.get(node.id)!;
      positions.current.set(node.id,p);
      graph.addNode(node.id,{...node,...p,type:node.kind === "project"?"square":"circle",size:node.kind === "space" ? (!node.parents.length ? 18 : 9)+Math.min(9,Math.sqrt(node.recent)*2) : 4,color:"#00cde8"});
    });
    data.edges.forEach((edge,i) => { if(graph.hasNode(edge.source)&&graph.hasNode(edge.target))graph.addEdgeWithKey(String(i),edge.source,edge.target,{...edge,size:1,color:"#36535b"}); });
    const show = (id: string) => {
      const n=graph.getNodeAttributes(id);
      if(state.current.technology && !n.technologies?.includes(Number(state.current.technology)))return false;
      if(n.kind === "space")return (state.current.older || n.recent>0) && (!state.current.domain || n.domains.includes(Number(state.current.domain)));
      return (!state.current.domain || n.domains.includes(Number(state.current.domain))) && graph.neighbors(id).some(other => {const s=graph.getNodeAttributes(other);return (state.current.older || s.recent>0) && (!state.current.domain || s.domains.includes(Number(state.current.domain)));});
    };
    try {
      sigma = new Sigma(graph,container.current,{nodeProgramClasses:{square:NodeSquareProgram},allowInvalidContainer:true,stagePadding:55,labelFont:"ui-monospace, monospace",labelSize:12,labelDensity:.6,labelGridCellSize:110,labelRenderedSizeThreshold:7,minCameraRatio:.12,maxCameraRatio:2.5,zoomToSizeRatioFunction:()=>1,enableCameraRotation:false,
        nodeReducer:(id,a)=>{
          const selected=state.current.hover || (latest.current.selected ? `s:${latest.current.selected}` : null);
          const near=!selected || id===selected || (graph.hasNode(selected)&&graph.areNeighbors(id,selected));
          const broad=a.kind === "space" && !a.parents.length;
          const detailed=state.current.ratio<(a.kind === "project" ? .3 : .5);
          const palette=latest.current.light ? ["#846700","#007d91","#6c4aa5"] : ["#ffdf38","#00cee8","#bda0ff"];
          const domainColors=latest.current.light?["#007d91","#846700","#6c4aa5","#a74456"]:["#00cee8","#ffdf38","#bda0ff","#ffa2b4"];
          const domainId=state.current.domain?Number(state.current.domain):(a.domains?.length?Math.min(...a.domains):0);
          const color=domainId?domainColors[domainId%domainColors.length]:palette[a.kind === "project"?2:broad?0:1];
          return {...a,hidden:!show(id),size:broad?a.size:a.kind==="project"?(detailed?6:3):Math.max(id===selected?10:3,a.size*Math.min(1,.22/state.current.ratio)),label:near&&(broad||detailed||id===selected||!!state.current.hover)?a.label:null,
            color:near?color:(latest.current.light?"#80979d":"#526a72"),highlighted:id===selected,zIndex:id===selected?3:broad?2:1,forceLabel:id===selected};
        },
        edgeReducer:(id,a)=>{const [s,t]=graph.extremities(id);const selected=state.current.hover || (latest.current.selected?`s:${latest.current.selected}`:null);return {...a,hidden:!show(s)||!show(t),color:selected&&(s===selected||t===selected)?(latest.current.light?"#006d80":"#00a6bd"):(latest.current.light?"#a7b8bd":"#263f47"),size:a.kind === "membership"&&state.current.ratio>.5?.5:1};},
        labelColor:{color:props.light?"#17353e":"#dce9ed"},
        defaultDrawNodeHover:(ctx,n)=>{ctx.beginPath();ctx.arc(n.x,n.y,n.size+4,0,Math.PI*2);ctx.strokeStyle=latest.current.light?"#10282e":"#ffffff";ctx.lineWidth=2;ctx.stroke();if(n.label){ctx.font="bold 13px ui-monospace, monospace";ctx.fillStyle=latest.current.light?"#10282e":"#ffffff";ctx.fillText(n.label,n.x+n.size+7,n.y+4);}},
      });
      renderer.current=sigma;
      sigma.setCustomBBox({x:[-1,1],y:[-1,1]});
      sigma.getCamera().setState(camera.current);
      let dragged: string | null=null, moved=false;
      sigma.on("enterNode",({node})=>setHover(node));sigma.on("leaveNode",()=>setHover(null));
      sigma.on("clickNode",({node})=>{if(!moved)activate(data.nodes.find(n=>n.id===node)!);});
      sigma.on("downNode",({node,preventSigmaDefault})=>{dragged=node;moved=false;preventSigmaDefault();});
      sigma.getMouseCaptor().on("mousemovebody",event=>{if(!dragged)return;const p=sigma.viewportToGraph(event);graph.mergeNodeAttributes(dragged,p);positions.current.set(dragged,p);moved=true;event.preventSigmaDefault();event.original.preventDefault();});
      sigma.getMouseCaptor().on("mouseup",()=>{dragged=null;setTimeout(()=>{moved=false;},0);});
      sigma.getCamera().on("updated",()=>{camera.current=sigma.getCamera().getState();setRatio(camera.current.ratio);});
    } catch {setError("WebGL is unavailable. Use the accessible node list and space browser below.");return;}
    return ()=>{sigma.kill();renderer.current=null;};
  },[data]);
  useEffect(()=>{renderer.current?.setSetting("labelColor",{color:props.light?"#17353e":"#dce9ed"});renderer.current?.refresh();},[props.selected,props.light,older,domain,technology,hover,ratio]);
  useEffect(()=>{setHover(null);if(props.selected===null)setNodeChoice("");},[props.selected]);
  useEffect(()=>{if(props.visible)requestAnimationFrame(()=>renderer.current?.resize());},[props.visible]);
  const focusNode=data?.nodes.find(n=>n.id===(hover || (props.selected?`s:${props.selected}`:nodeChoice)));
  const connections=data?.edges.filter(e=>e.source===focusNode?.id||e.target===focusNode?.id) || [];
  const domains=[...new Set(data?.nodes.flatMap(n=>n.domains)||[])];
  const choices=data?.nodes.filter(n=>(!domain||n.domains.includes(Number(domain)))&&(!technology||n.technologies?.includes(Number(technology)))&&(older||(n.kind === "space" ? n.recent>0 : data.edges.some(e=>e.target===n.id&&data.nodes.some(s=>s.id===e.source&&s.recent>0))))) || [];
  return <section aria-label="Discovery graph" className="network">
    <div className="graph-toolbar"><label><input type="checkbox" checked={older} onChange={e=>setOlder(e.target.checked)}/> Show older spaces</label>
      {!!domains.length&&<label>Domain <select aria-label="Graph domain" value={domain} onChange={e=>setDomain(e.target.value)}><option value="">All domains</option>{domains.map(id=><option key={id} value={id}>{props.domains.find(d=>d.id===id)?.name ?? "Loading domain…"}</option>)}</select></label>}
      {!!data?.technologies?.length&&<label>Technology <select aria-label="Graph technology" value={technology} onChange={e=>setTechnology(e.target.value)}><option value="">All technologies</option>{data.technologies.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
      <button onClick={()=>renderer.current?.getCamera().animatedZoom()}>Zoom in</button><button onClick={()=>renderer.current?.getCamera().animatedUnzoom()}>Zoom out</button><button onClick={()=>renderer.current?.getCamera().animatedReset()}>Fit graph</button>
      <span aria-label="Graph zoom">{Math.round(100/ratio)}%</span>
    </div>
    {error&&<p role="alert">{error} <button onClick={()=>load()}>Retry graph</button></p>}
    {!data&& !error&&<p role="status">Loading graph…</p>}
    <div ref={container} className="sigma-canvas" aria-label="Circular graph canvas" tabIndex={0} onKeyDown={e=>{const camera=renderer.current?.getCamera();if(!camera)return;const s=camera.getState();if(e.key==="+"||e.key==="=")camera.animatedZoom();else if(e.key==="-")camera.animatedUnzoom();else if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();camera.setState({x:s.x+(e.key==="ArrowLeft"?-.08:e.key==="ArrowRight"?.08:0)*s.ratio,y:s.y+(e.key==="ArrowDown"?-.08:e.key==="ArrowUp"?.08:0)*s.ratio});}}}/>
    <p className="coverage">Large circles: broad spaces · small circles: narrower spaces · squares: projects. Solid lines show hierarchy or membership. Zoom to bring details forward; use arrows to pan and +/− to zoom. Color indicates a domain when assigned; node size and shape distinguish levels. Counts cover all matching catalog projects. Suggested connections are off.</p>
    {!!domains.length&&<p className="coverage">Domain colors: {domains.map(id=><span key={id} style={{color:domainColor(id)}}>{props.domains.find(d=>d.id===id)?.name ?? "Loading…"} · </span>)}Multiple-domain nodes use the selected domain, or their first assigned domain.</p>}
    {data&&<p className="coverage">{data.nodes.filter(n=>n.kind==="space").length} spaces · {data.nodes.filter(n=>n.kind==="project").length} projects on canvas{data.bounded?" · Bounded view: use the space browser for the full catalog.":""}</p>}
    {props.selected&&!data?.nodes.some(n=>n.id===`s:${props.selected}`)&&<button onClick={()=>load(props.selected!)}>Show selected space on graph</button>}
    <label>Explore a graph node <select aria-label="Explore a graph node" value={nodeChoice} onChange={e=>{setNodeChoice(e.target.value);const node=data?.nodes.find(n=>n.id===e.target.value);if(node){setHover(node.id);const p=renderer.current?.getNodeDisplayData(node.id);if(p)renderer.current?.getCamera().animate({x:p.x,y:p.y,ratio:.45});}}}><option value="">Choose a space or project</option>{choices.map(n=><option key={n.id} value={n.id}>{n.kind}: {n.label}</option>)}</select></label>
    {nodeChoice&&<button onClick={()=>{const n=data?.nodes.find(n=>n.id===nodeChoice);if(n)activate(n);}}>Select node</button>}
    {focusNode&&<aside className="graph-selection"><h2>{focusNode.label}</h2><p>{focusNode.description}</p>{!!focusNode.domains.length&&<p className="coverage">Domains: {props.domains.filter(d=>focusNode.domains.includes(d.id)).map(d=>d.name).join(", ")}</p>}{focusNode.kind==="space"&&<><p>{focusNode.recent} recent · {focusNode.total} total catalog projects</p><button onClick={()=>{props.onSelect(focusNode.entity_id);props.onBrowse();}}>Browse matching projects</button></>}
      <ul>{connections.map(e=>{const other=data!.nodes.find(n=>n.id===(e.source===focusNode.id?e.target:e.source))!;return <li key={`${e.source}-${e.target}`}><button onClick={()=>{setHover(null);activate(other);}}>{other.label}</button> · {e.kind}: {e.explanation}</li>;})}</ul>
    </aside>}
  </section>;
}
