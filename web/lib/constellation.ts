export type GraphNode = { id: string; kind: "space" | "project"; entity_id: number; label: string; description: string; recent: number; total: number; parents: string[]; domains: number[]; technologies?: number[] };
export type GraphEdge = { source: string; target: string; kind: "subcategory" | "membership"; explanation: string };
export type GraphData = { nodes: GraphNode[]; technologies?: {id:number;name:string}[]; edges: GraphEdge[]; bounded: boolean; total_spaces: number; space_budget: number; project_budget: number };
export type Position = { x: number; y: number };

function hash(id: string) { let n = 2166136261; for (const c of id) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return (n >>> 0) / 4294967296; }

// A finite deterministic layout, bounded by a disk. No simulation runs during interaction.
export function constellation(data: GraphData): Map<string, Position> {
  const nodes = [...data.nodes].sort((a,b) => a.id.localeCompare(b.id));
  const index = new Map(nodes.map((n,i) => [n.id,i]));
  const roots = nodes.filter(n => n.kind === "space" && !n.parents.some(p => index.has(p)));
  const positions = nodes.map(n => { const angle = hash(n.id) * Math.PI * 2; return { x: Math.cos(angle)*.7, y: Math.sin(angle)*.7 }; });
  roots.forEach((n,i) => { const angle = (i+.5) / roots.length * Math.PI*2; positions[index.get(n.id)!] = { x: Math.cos(angle)*.55, y: Math.sin(angle)*.55 }; });
  const ready = new Set(roots.map(n => n.id));
  for (let pass=0; pass<nodes.length; pass++) {
    let changed = false;
    nodes.forEach((n,i) => {
      if (ready.has(n.id)) return;
      const parentIds = n.kind === "space" ? n.parents : data.edges.filter(e => e.target === n.id).map(e => e.source);
      const parents = parentIds.filter(id => ready.has(id) && index.has(id));
      if (!parents.length) return;
      const center = parents.reduce((p,id) => ({x:p.x+positions[index.get(id)!].x/parents.length,y:p.y+positions[index.get(id)!].y/parents.length}),{x:0,y:0});
      const angle = hash(n.id) * Math.PI*2;
      positions[i] = {x:center.x+.15*Math.cos(angle),y:center.y+.15*Math.sin(angle)};
      ready.add(n.id); changed = true;
    });
    if (!changed) break;
  }
  const anchors = positions.map(p => ({...p}));
  const links = data.edges.filter(e => index.has(e.source) && index.has(e.target)).map(e => [index.get(e.source)!,index.get(e.target)!]);
  for (let step=0; step<100; step++) {
    const forces = nodes.map(() => ({x:0,y:0}));
    for (let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++) {
      const dx=positions[i].x-positions[j].x || .0001, dy=positions[i].y-positions[j].y || .0001;
      const d2=dx*dx+dy*dy+.002;
      // Scale aggregate repulsion to avoid boundary pileups in larger payloads.
      const strength=Math.min(1,8/nodes.length)*(nodes[i].kind === "space" || nodes[j].kind === "space" ? .00035 : .0001)/d2;
      forces[i].x+=dx*strength; forces[i].y+=dy*strength; forces[j].x-=dx*strength; forces[j].y-=dy*strength;
    }
    for(const [i,j] of links) {
      const dx=positions[j].x-positions[i].x,dy=positions[j].y-positions[i].y,d=Math.hypot(dx,dy)||1;
      const k=(d-.19)*.055/d;
      forces[i].x+=dx*k;forces[i].y+=dy*k;forces[j].x-=dx*k;forces[j].y-=dy*k;
    }
    nodes.forEach((n,i) => {
      const p=positions[i], f=forces[i], tether=n.kind === "space" && !n.parents.length ? .08 : .012;
      p.x+=Math.max(-.025,Math.min(.025,f.x+(anchors[i].x-p.x)*tether));
      p.y+=Math.max(-.025,Math.min(.025,f.y+(anchors[i].y-p.y)*tether));
      const radius=Math.hypot(p.x,p.y);
      if(radius>.93) {p.x*=.93/radius;p.y*=.93/radius;}
    });
  }
  return new Map(nodes.map((n,i) => [n.id,positions[i]]));
}
