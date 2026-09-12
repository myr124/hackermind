import assert from "node:assert/strict";
import { chromium } from "playwright";
const base=process.env.BASE_URL || "http://127.0.0.1:3001";
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:["--enable-unsafe-swiftshader"]});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 let requests=0;page.on("request",r=>{if(r.url().includes("/api/graph"))requests++;});
 await page.goto(base);
 const graph=await (await page.request.get(`${base}/api/graph`)).json();
 await page.locator(".sigma-canvas canvas").first().waitFor();
 assert.equal(await page.getByText("WebGL is unavailable.",{exact:false}).count(),0);
 const chooser=page.getByRole("combobox",{name:"Explore a graph node"});
 const count=await chooser.locator("option").count();
 assert.ok(count>1,"Real graph should contain classified nodes");
 await page.screenshot({path:"/tmp/hm-graph-desktop.png",fullPage:true});
 await page.getByRole("button",{name:"Zoom in",exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Graph zoom"]').textContent!=="100%");
 assert.equal(await chooser.locator("option").count(),count,"Zoom must not collapse nodes");
 const root=graph.nodes.find(n=>n.kind==="space"&&!n.parents.length&&n.recent>0);
 await chooser.selectOption(root.id);
 await page.getByRole("button",{name:"Select node",exact:true}).click();
 await page.getByRole("button",{name:"Browse matching projects",exact:true}).click();
 await page.locator(".card").first().waitFor();
 assert.equal(await page.getByLabel("Browse a problem space").inputValue(),String(root.entity_id));
 await page.locator(".card").first().click();
 await page.locator("dialog blockquote").first().waitFor();
 await page.keyboard.press("Escape");
 await page.getByRole("button",{name:"Problem Spaces",exact:true}).click();
 const zoom=await page.getByLabel("Graph zoom",{exact:true}).innerText();
 await page.getByRole("button",{name:"Light theme",exact:true}).click();
 assert.equal(await page.getByLabel("Graph zoom",{exact:true}).innerText(),zoom);
 await page.getByRole("button",{name:"Recently Added",exact:true}).click();
 await page.getByRole("button",{name:"Problem Spaces",exact:true}).click();
 assert.equal(await page.getByLabel("Graph zoom",{exact:true}).innerText(),zoom);
 assert.equal(requests,1,"Selection, zoom, theme and view switches must not rebuild graph data");
 await page.setViewportSize({width:390,height:844});
 await page.locator(".sigma-canvas").focus();await page.keyboard.press("ArrowRight");
 await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);
 await page.screenshot({path:"/tmp/hm-graph-mobile.png",fullPage:true});
 await page.getByRole("button",{name:"Reset to all spaces",exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Explore a graph node"]').value==="");
 assert.equal(await page.locator(".graph-selection").count(),0);
 // Focusing a node centers it, so exercise drag without depending on layout coordinates.
 const project=graph.nodes.find(n=>n.kind==="project");
 await chooser.selectOption(project.id);
 await page.locator(".sigma-canvas").scrollIntoViewIfNeeded();
 await page.waitForTimeout(400);
 const canvas=await page.locator(".sigma-canvas").boundingBox();
 const x=canvas.x+canvas.width/2,y=canvas.y+canvas.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+35,y+20,{steps:8});await page.mouse.up();
 assert.equal(await page.locator("dialog[open]").count(),0,"Dragging must not open project details");
 await page.waitForTimeout(400); // Separate the next click from Sigma's double-click window.
 await page.mouse.click(x+35,y+20);
 await page.locator("dialog[open]").waitFor();
 await page.keyboard.press("Escape");
 for (const [name,key] of [["Graph domain","domains"],["Graph technology","technologies"]]) {
   const filter=page.getByRole("combobox",{name,exact:true});
   if(!await filter.count())continue;
   const value=await filter.locator("option").nth(1).getAttribute("value");
   await filter.selectOption(value);
   const expected=graph.nodes.filter(n=>n[key]?.includes(Number(value))).map(n=>n.id);
   await page.waitForFunction(expected=>[...document.querySelector('[aria-label="Explore a graph node"]').options].every(o=>!o.value||expected.includes(o.value)),expected);
   assert.ok(await chooser.locator("option").count()>1);
   await page.getByRole("button",{name:"Recently Added",exact:true}).click();
   await page.getByRole("button",{name:"Problem Spaces",exact:true}).click();
   assert.equal(await filter.inputValue(),value);
   await filter.selectOption("");
 }
 assert.deepEqual(errors,[]);
 console.log("Real graph browser checks passed: WebGL, zoom without collapse, keyboard selection, descendant cards/detail, preserved camera, themes, mobile and stable data.");

 // Exercise the full rendering budget under mobile CPU throttling, without writing fixtures to the database.
 const nodes=[],edges=[];
 for(let i=0;i<200;i++){nodes.push({id:`s:${i}`,kind:"space",entity_id:i+1,label:`Need ${i}`,description:"A need",recent:i===199?0:50,total:50,parents:i<10?[]:[`s:${i%10}`],domains:[]});if(i>=10)edges.push({source:`s:${i%10}`,target:`s:${i}`,kind:"subcategory",explanation:"Narrower need"});}
 for(let i=0;i<400;i++){nodes.push({id:`p:${i}`,kind:"project",entity_id:i+1,label:`Build ${i}`,description:"A project",recent:0,total:0,parents:[],domains:[]});edges.push({source:`s:${10+i%190}`,target:`p:${i}`,kind:"membership",explanation:"Addresses need"});}
 await page.route("**/api/graph",r=>r.fulfill({json:{nodes,edges,bounded:true,total_spaces:200,space_budget:200,project_budget:400}}));
 const cdp=await page.context().newCDPSession(page);await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
 const started=Date.now();await page.reload();await page.locator(".sigma-canvas canvas").first().waitFor();
 await page.getByText("200 spaces · 400 projects on canvas",{exact:false}).waitFor();
 const elapsed=Date.now()-started;
 assert.ok(elapsed<10000,`Mobile-budget readiness took ${elapsed}ms`);
 const before=await chooser.locator("option").count();
 await page.getByRole("checkbox",{name:"Show older spaces"}).check();
 assert.ok(await chooser.locator("option").count()>before);
 await page.getByRole("button",{name:"Zoom in",exact:true}).click();
 assert.equal(await chooser.locator("option").count(),601);
 await page.waitForTimeout(400);
 await page.screenshot({path:"/tmp/hm-budget-mobile.png",fullPage:true});
 assert.deepEqual(errors,[]);
 console.log(`600-node mobile rendering at 4× CPU slowdown ready in ${elapsed}ms. Older spaces and all nodes remain accessible.`);
} finally {await browser.close();}
