import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, BarChart3, Building2, Check, ChevronRight, CircleDollarSign, Clock3,
  Copy, Eraser, Eye, FastForward, Grid3X3, Hammer, Home, Layers3, MousePointer2,
  Pause, Play, RotateCcw, Save, Sparkles, Star, Trash2, Undo2, Redo2, Users,
  Route, Sun, Armchair, AlertTriangle, CarFront, Coffee, PanelTop, Gauge, X
} from './Icons'
import { BRIEFS, DEFAULT_PROJECTS, OBJECTS, TILE } from './game/catalog'
import { DEFAULT_FINISH, FINISH_LIBRARY, finishById } from './game/materials'
import { cloneProject, edgeKey, key, tileKey } from './engine/grid'
import { applyWallSegment, buildRectWalls, ensureFloorMeta, floodEnclosed, rectangleCells, snapOrthogonal } from './engine/buildTools'
import { runSimulation, validateProject } from './engine/sim'

const STORAGE_KEY = 'built-poc-portfolio-v3'
const CELL = 22

function uid(prefix='id') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}` }
function money(v=0) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v) }

function blankProject(type) {
  const base = cloneProject(DEFAULT_PROJECTS[type])
  return { id: uid(type), type, name: BRIEFS[type].title, ...base, history: [], runs: [], createdAt: Date.now() }
}

function starterProject(type) {
  const p = blankProject(type)
  const brief = BRIEFS[type]
  const f = ensureFloorMeta(p.floors[0])
  if (type === 'coffee') {
    // A deliberately simple starter: 15m × 10.5m shell with patio and approach.
    buildRectWalls(f,8,6,28,20,brief.size.cols,brief.size.rows,'brick-pale')
    for (let y=6;y<20;y++) for (let x=8;x<28;x++) { f.tiles[tileKey(x,y)]='interior'; f.finishes[tileKey(x,y)]='terrazzo-cream' }
    for (let y=10;y<=15;y++) for (let x=3;x<8;x++) { f.tiles[tileKey(x,y)]='path'; f.finishes[tileKey(x,y)]='concrete-light' }
    for (let y=20;y<=24;y++) for (let x=17;x<=27;x++) { f.tiles[tileKey(x,y)]='patio'; f.finishes[tileKey(x,y)]='deck-oak' }
    f.objects = [
      {id:uid(),type:'entrance',x:8,y:12},{id:uid(),type:'register',x:13,y:10},
      {id:uid(),type:'pickup',x:17,y:10},{id:uid(),type:'prep',x:20,y:8},
      {id:uid(),type:'table',x:12,y:15},{id:uid(),type:'table',x:18,y:15},
      {id:uid(),type:'table',x:23,y:14},{id:uid(),type:'toilet',x:25,y:18},
      {id:uid(),type:'trash',x:19,y:9},{id:uid(),type:'window',x:14,y:6},
      {id:uid(),type:'window',x:21,y:6},{id:uid(),type:'plant',x:18,y:22},
      {id:uid(),type:'bench',x:22,y:22}
    ]
  } else {
    buildRectWalls(f,13,7,34,24,brief.size.cols,brief.size.rows,'plaster-sand')
    for (let y=7;y<24;y++) for (let x=13;x<34;x++) { f.tiles[tileKey(x,y)]='interior'; f.finishes[tileKey(x,y)]='tile-white' }
    // Four-cell-wide lane around the building: one lane visually reads as a real road width.
    for (let x=3;x<=44;x++) for (let y=2;y<=5;y++) { f.tiles[tileKey(x,y)]='drive'; f.finishes[tileKey(x,y)]='asphalt-dark' }
    for (let x=41;x<=44;x++) for (let y=2;y<=28;y++) { f.tiles[tileKey(x,y)]='drive'; f.finishes[tileKey(x,y)]='asphalt-dark' }
    for (let x=8;x<=44;x++) for (let y=25;y<=28;y++) { f.tiles[tileKey(x,y)]='drive'; f.finishes[tileKey(x,y)]='asphalt-dark' }
    for (let x=6;x<=12;x++) for (let y=14;y<=17;y++) { f.tiles[tileKey(x,y)]='parking'; f.finishes[tileKey(x,y)]='parking-asphalt' }
    for (let x=7;x<=13;x++) for (let y=18;y<=20;y++) { f.tiles[tileKey(x,y)]='path'; f.finishes[tileKey(x,y)]='concrete-light' }
    f.objects = [
      {id:uid(),type:'entrance',x:13,y:18},{id:uid(),type:'register',x:17,y:15},
      {id:uid(),type:'pickup',x:21,y:15},{id:uid(),type:'prep',x:28,y:12},
      {id:uid(),type:'table',x:17,y:9},{id:uid(),type:'table',x:23,y:9},
      {id:uid(),type:'toilet',x:30,y:20},{id:uid(),type:'driveOrder',x:36,y:4},
      {id:uid(),type:'drivePickup',x:34,y:20},{id:uid(),type:'window',x:22,y:7},
      {id:uid(),type:'plant',x:10,y:19}
    ]
  }
  return p
}

function App() {
  const [screen, setScreen] = useState('home')
  const [project, setProject] = useState(null)
  const [portfolio, setPortfolio] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio)) }, [portfolio])

  const openProject = (type, starter=false) => {
    setProject(starter ? starterProject(type) : blankProject(type))
    setScreen('project')
  }
  const reopen = (entry) => { setProject(cloneProject(entry.project)); setScreen('project') }
  const savePortfolio = (entry) => {
    setPortfolio(prev => {
      const filtered = prev.filter(x => x.id !== entry.id)
      return [entry, ...filtered].slice(0, 20)
    })
  }

  if (screen === 'home') return <HomeScreen portfolio={portfolio} onOpen={openProject} onReopen={reopen} />
  return <ProjectScreen project={project} setProject={setProject} onBack={()=>setScreen('home')} onSavePortfolio={savePortfolio} />
}

function HomeScreen({ portfolio, onOpen, onReopen }) {
  return <div className="app home-shell">
    <header className="brand-header">
      <div className="brand-mark">B</div>
      <div>
        <div className="eyebrow">ARCHITECTURE SANDBOX / POC 0.3.0</div>
        <h1>BUILT</h1>
        <p>Make a place. Open the doors. See what your decisions do.</p>
      </div>
      <div className="header-proof"><Sparkles size={16}/> deterministic simulation · local portfolio</div>
    </header>

    <main className="home-main">
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="kicker">CREATE → OBSERVE → IMPROVE</span>
          <h2>Your buildings are the progression system.</h2>
          <p>Start from an empty site, define the plan, place real functions, then run a day of customers and staff through your design. Heatmaps and review notes show where the building works — and where it fights you.</p>
          <div className="hero-actions">
            <button className="primary" onClick={()=>onOpen('coffee', false)}><Hammer size={17}/> Start empty coffee shop</button>
            <button className="secondary" onClick={()=>onOpen('coffee', true)}><Play size={17}/> Open playable example</button>
          </div>
        </div>
        <MiniBuilding />
      </section>

      <section className="project-choice">
        <div className="section-heading">
          <div><span className="eyebrow">PROJECT BRIEFS</span><h3>Two small problems. One shared building system.</h3></div>
        </div>
        <div className="brief-cards">
          <BriefCard brief={BRIEFS.coffee} icon={<Coffee/>} onEmpty={()=>onOpen('coffee',false)} onStarter={()=>onOpen('coffee',true)} />
          <BriefCard brief={BRIEFS.drive} icon={<CarFront/>} onEmpty={()=>onOpen('drive',false)} onStarter={()=>onOpen('drive',true)} />
        </div>
      </section>

      <section className="portfolio-home">
        <div className="section-heading"><div><span className="eyebrow">YOUR WORKS</span><h3>Portfolio</h3></div><span className="muted">Saved locally in this browser</span></div>
        {portfolio.length === 0 ? <div className="empty-portfolio"><Building2 size={34}/><div><strong>No completed works yet.</strong><p>Accept a project after a simulation run and it will live here as a historical snapshot.</p></div></div> :
          <div className="portfolio-grid">{portfolio.map(entry => <PortfolioCard key={entry.id} entry={entry} onClick={()=>onReopen(entry)}/>)}</div>}
      </section>
    </main>
  </div>
}

function BriefCard({ brief, icon, onEmpty, onStarter }) {
  return <article className="brief-card">
    <div className="brief-icon">{icon}</div>
    <span className="eyebrow">{brief.accent}</span>
    <h4>{brief.title}</h4>
    <p>{brief.subtitle}</p>
    <div className="brief-meta"><span>{brief.lot}</span><span>{brief.arrivals} arrivals</span></div>
    <div className="tension-list">{brief.tensions.slice(0,3).map(x=><span key={x}>{x}</span>)}</div>
    <div className="card-actions"><button className="primary small" onClick={onEmpty}>Start empty</button><button className="ghost small" onClick={onStarter}>Playable example</button></div>
  </article>
}

function MiniBuilding() {
  return <div className="mini-stage" aria-hidden="true">
    <div className="mini-grid"/>
    <div className="mini-building block-a"><span>ORDER</span></div>
    <div className="mini-building block-b"><span>SEATING</span></div>
    <div className="mini-patio"><i/><i/><i/></div>
    <div className="mini-path" />
    {[0,1,2,3,4,5].map(i=><div key={i} className="mini-person" style={{left:`${24+i*10}%`, top:`${69-(i%2)*8}%`}} />)}
    <div className="mini-caption"><Route size={15}/> spatial decisions become behavior</div>
  </div>
}

function PortfolioCard({entry,onClick}) {
  const m = entry.run?.metrics || {}
  return <button className="portfolio-card" onClick={onClick}>
    <div className="portfolio-thumb"><Building2/><span>{entry.type === 'coffee' ? 'CAFÉ' : 'DRIVE-THRU'}</span></div>
    <div className="portfolio-card-body"><div className="portfolio-title"><strong>{entry.name}</strong><span>{'★'.repeat(entry.rating || 0)}</span></div>
      <div className="portfolio-stats"><span>{m.throughput || 0}% throughput</span><span>{m.avgWait || 0}m wait</span><span>{money(m.buildCost||0)}</span></div>
    </div>
  </button>
}

function ProjectScreen({ project, setProject, onBack, onSavePortfolio }) {
  const brief = BRIEFS[project.type]
  const [mode, setMode] = useState('build')
  const [view, setView] = useState('plan')
  const [isoMode, setIsoMode] = useState('external')
  const [tool, setTool] = useState({kind:'select'})
  const [activeFloor, setActiveFloor] = useState(project.activeFloor || 0)
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [run, setRun] = useState(project.runs?.at(-1) || null)
  const [previousRun, setPreviousRun] = useState(project.runs?.at(-2) || null)
  const [overlay, setOverlay] = useState('circulation')
  const [simPlaying, setSimPlaying] = useState(true)
  const [simSpeed, setSimSpeed] = useState(1)
  const [simTime, setSimTime] = useState(0)
  const [seed, setSeed] = useState(42)
  const [toast, setToast] = useState(null)
  const [rating, setRating] = useState(4)
  const [note, setNote] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [buildCategory, setBuildCategory] = useState('Architecture')
  const [infoOpen, setInfoOpen] = useState(false)
  const validation = useMemo(()=>validateProject(project,brief),[project,brief])

  useEffect(()=>{
    // Old local portfolio entries are upgraded lazily so the new finish/rendering system is backward compatible.
    project.floors.forEach(ensureFloorMeta)
  },[project])

  const message=(text)=>{setToast(text);setTimeout(()=>setToast(null),2400)}
  const commit = (next) => {
    next.floors.forEach(ensureFloorMeta)
    setHistory(h => [...h.slice(-39), cloneProject(project)])
    setFuture([])
    setProject(next)
  }
  const undo = () => {
    if (!history.length) return
    const prior = history.at(-1)
    setFuture(f => [cloneProject(project), ...f])
    setHistory(h => h.slice(0,-1)); setProject(prior)
  }
  const redo = () => {
    if (!future.length) return
    const next = future[0]
    setHistory(h => [...h, cloneProject(project)])
    setFuture(f => f.slice(1)); setProject(next)
  }
  const switchMode=(next)=>{setMode(next); if(next!=='build')setDrawerOpen(false)}
  const simulate = () => {
    const nextRun = runSimulation(project, brief, seed)
    setPreviousRun(run); setRun(nextRun)
    setProject(p => ({...p, runs:[...(p.runs||[]),nextRun].slice(-8)}))
    switchMode('simulate'); setSimTime(0); setSimPlaying(true)
    message(nextRun.validation.ready ? 'Building opened with the same deterministic demand seed.' : 'Simulation ran, but the brief still has missing functions.')
  }
  const archive = () => {
    if (!run) return
    const entry = { id:project.id,name:project.name,type:project.type,rating,note,savedAt:Date.now(),project:cloneProject(project),run }
    onSavePortfolio(entry); message('Saved to your portfolio as a project snapshot.')
  }

  return <div className="app project-shell">
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    <header className="project-topbar">
      <button className="icon-button" onClick={onBack} title="Back"><ArrowLeft/></button>
      <div className="project-identity"><span className="brand-mini">B</span><div><span className="eyebrow">{brief.accent}</span><input value={project.name} onChange={e=>setProject({...project,name:e.target.value})}/></div></div>
      <div className="mode-switch">
        <button className={mode==='build'?'active':''} onClick={()=>switchMode('build')}><Hammer/>Build</button>
        <button className={mode==='simulate'?'active':''} onClick={()=>switchMode('simulate')}><Play/>Live</button>
        <button className={mode==='analyze'?'active':''} onClick={()=>switchMode('analyze')} disabled={!run}><BarChart3/>Analyze</button>
        <button className={mode==='review'?'active':''} onClick={()=>switchMode('review')} disabled={!run}><PanelTop/>Review</button>
      </div>
      <div className="top-actions">
        <button className="icon-button undo-action" onClick={undo} disabled={!history.length}><Undo2/></button>
        <button className="icon-button undo-action" onClick={redo} disabled={!future.length}><Redo2/></button>
        <button className={`details-button ${infoOpen?'active':''}`} onClick={()=>setInfoOpen(v=>!v)}><PanelTop/><span>{mode==='build'?'Brief':'Details'}</span></button>
        <button className="primary open-button" onClick={simulate}><Play size={16}/><span>Open building</span></button>
      </div>
    </header>

    <div className="project-body">
      <BuildRail mode={mode} view={view} setView={setView} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} buildCategory={buildCategory} setBuildCategory={setBuildCategory} activeFloor={activeFloor} setActiveFloor={setActiveFloor}/>
      {mode==='build' && drawerOpen && <BuildDrawer category={buildCategory} setCategory={setBuildCategory} tool={tool} setTool={setTool} projectType={project.type} onClose={()=>setDrawerOpen(false)}/>} 
      <main className="canvas-wrap">
        {view==='section' ? <SectionView project={project} brief={brief}/> : view==='iso' ?
          <IsometricView project={project} brief={brief} activeFloor={activeFloor} isoMode={isoMode} setIsoMode={setIsoMode}/> :
          <SiteCanvas project={project} brief={brief} activeFloor={activeFloor} mode={mode} tool={tool} commit={commit} selected={selected} setSelected={setSelected} run={run} overlay={overlay} simPlaying={simPlaying} simSpeed={simSpeed} simTime={simTime} setSimTime={setSimTime} onMessage={message}/>
        }
        <CanvasHud brief={brief} project={project} run={run} mode={mode} activeFloor={activeFloor} view={view}/>
        {view==='iso' && <IsoFloorControl activeFloor={activeFloor} setActiveFloor={setActiveFloor} isoMode={isoMode} setIsoMode={setIsoMode}/>} 
        {mode==='simulate' && run && view==='plan' && <SimControls run={run} playing={simPlaying} setPlaying={setSimPlaying} speed={simSpeed} setSpeed={setSimSpeed}/>} 
        {mode==='analyze' && run && view==='plan' && <OverlayPicker overlay={overlay} setOverlay={setOverlay}/>} 
      </main>
      {infoOpen && <div className="right-drawer-shell"><button className="drawer-close info-close" onClick={()=>setInfoOpen(false)}><X/></button><RightPanel project={project} brief={brief} selected={selected} activeFloor={activeFloor} commit={commit} validation={validation} run={run} previousRun={previousRun} mode={mode} overlay={overlay} setOverlay={setOverlay} rating={rating} setRating={setRating} note={note} setNote={setNote} archive={archive} seed={seed} setSeed={setSeed}/></div>}
    </div>
  </div>
}

function BuildRail({mode,view,setView,drawerOpen,setDrawerOpen,buildCategory,setBuildCategory,activeFloor,setActiveFloor}) {
  return <aside className="tool-rail">
    <button className={mode==='build'&&drawerOpen?'active':''} onClick={()=>setDrawerOpen(v=>!v)}><Hammer/><span>Build</span></button>
    <div className="rail-divider"/>
    <button className={view==='plan'?'active':''} onClick={()=>setView('plan')}><Grid3X3/><span>Plan</span></button>
    <button className={view==='section'?'active':''} onClick={()=>setView('section')}><Layers3/><span>Section</span></button>
    <button className={view==='iso'?'active':''} onClick={()=>setView('iso')}><Building2/><span>3D</span></button>
    <div className="rail-spacer"/>
    <button className={activeFloor===0?'active floor-mini':''} onClick={()=>setActiveFloor(0)}><span className="floor-number">1</span><span>Floor</span></button>
    <button className={activeFloor===1?'active floor-mini':''} onClick={()=>setActiveFloor(1)}><span className="floor-number">2</span><span>Floor</span></button>
  </aside>
}

function BuildDrawer({category,setCategory,tool,setTool,projectType,onClose}) {
  const cats=['Architecture','Furniture','Decoration','Site']
  const objects=Object.entries(OBJECTS).filter(([type,o])=>o.category===category && (projectType==='drive'||!['driveOrder','drivePickup'].includes(type)))
  return <aside className="build-drawer">
    <div className="drawer-head"><div><span className="eyebrow">BUILD LIBRARY</span><strong>{category}</strong></div><button className="drawer-close" onClick={onClose}><X/></button></div>
    <div className="drawer-tabs">{cats.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    <div className="drawer-scroll">
      {category==='Architecture' && <>
        <div className="tool-section"><span className="panel-label">STRUCTURE</span><div className="large-tool-grid">
          <BuildChoice active={tool.kind==='select'} onClick={()=>setTool({kind:'select'})} icon={<MousePointer2/>} title="Select" subtitle="Inspect or remove"/>
          <BuildChoice active={tool.kind==='wall'} onClick={()=>setTool({kind:'wall',finish:tool.kind==='wall'?tool.finish:DEFAULT_FINISH.wall})} icon={<span className="wall-icon"/>} title="Wall line" subtitle="Drag start → end"/>
          <BuildChoice active={tool.kind==='room'} onClick={()=>setTool({kind:'room',finish:tool.kind==='room'?tool.finish:DEFAULT_FINISH.wall})} icon={<Grid3X3/>} title="Room shell" subtitle="Drag a rectangle"/>
          <BuildChoice active={tool.kind==='fill'} onClick={()=>setTool({kind:'fill',value:'interior',finish:tool.kind==='fill'?tool.finish:DEFAULT_FINISH.interior})} icon={<Sparkles/>} title="Floor fill" subtitle="Tap inside closed walls"/>
          <BuildChoice active={tool.kind==='erase'} onClick={()=>setTool({kind:'erase'})} icon={<Eraser/>} title="Erase" subtitle="Tap a cell or item"/>
        </div></div>
        {(tool.kind==='wall'||tool.kind==='room') && <FinishPicker surface="wall" selected={tool.finish||DEFAULT_FINISH.wall} onSelect={finish=>setTool({...tool,finish})}/>} 
        {tool.kind==='fill' && <FinishPicker surface="interior" selected={tool.finish||DEFAULT_FINISH.interior} onSelect={finish=>setTool({...tool,finish})}/>} 
        <ObjectChoices objects={objects} tool={tool} setTool={setTool}/>
      </>}
      {category==='Site' && <>
        <div className="tool-section"><span className="panel-label">DRAW AREAS</span><p className="drawer-help">Drag opposite corners. One cell is roughly 0.75–0.8 m, so a four-cell drive lane reads as a real lane width.</p><div className="surface-tools">
          {['path','patio',...(projectType==='drive'?['drive','parking']:[])].map(type=><button key={type} className={tool.kind==='area'&&tool.value===type?'active':''} onClick={()=>setTool({kind:'area',value:type,finish:DEFAULT_FINISH[type]})}><span className={`surface-chip ${type}`}/><span><strong>{TILE[type].label}</strong><small>Drag area</small></span></button>)}
        </div></div>
        {tool.kind==='area' && <FinishPicker surface={tool.value} selected={tool.finish||DEFAULT_FINISH[tool.value]} onSelect={finish=>setTool({...tool,finish})}/>} 
        <ObjectChoices objects={objects} tool={tool} setTool={setTool}/>
      </>}
      {(category==='Furniture'||category==='Decoration') && <ObjectChoices objects={objects} tool={tool} setTool={setTool}/>} 
    </div>
  </aside>
}

function BuildChoice({active,onClick,icon,title,subtitle}) { return <button className={`build-choice ${active?'active':''}`} onClick={onClick}>{icon}<span><strong>{title}</strong><small>{subtitle}</small></span></button> }
function ObjectChoices({objects,tool,setTool}) { return <div className="tool-section"><span className="panel-label">ITEMS</span><div className="object-cards">{objects.map(([type,o])=><button key={type} className={tool.kind==='object'&&tool.value===type?'active':''} onClick={()=>setTool({kind:'object',value:type})}><span className="object-glyph large">{o.icon}</span><span><strong>{o.label}</strong><small>{o.w||1}×{o.h||1} cells</small></span></button>)}</div></div> }

function FinishPicker({surface,selected,onSelect}) {
  const groups=FINISH_LIBRARY[surface]||{}
  return <div className="finish-picker tool-section"><span className="panel-label">MATERIAL / STYLE</span>{Object.entries(groups).map(([material,variants])=><div className="finish-group" key={material}><strong>{material}</strong><div>{variants.map(v=><button key={v.id} className={selected===v.id?'active':''} onClick={()=>onSelect(v.id)} title={`${material} · ${v.label}`}><i style={{background:v.base}}/><span>{v.label}</span></button>)}</div></div>)}</div>
}

function getSvgPoint(e,svg) {
  const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY
  const local=pt.matrixTransform(svg.getScreenCTM().inverse())
  return {x:local.x,y:local.y}
}
function localCell(p,brief){return {x:Math.max(0,Math.min(brief.size.cols-1,Math.floor(p.x/CELL))),y:Math.max(0,Math.min(brief.size.rows-1,Math.floor(p.y/CELL)))}}
function localVertex(p,brief){return {x:Math.max(0,Math.min(brief.size.cols,Math.round(p.x/CELL))),y:Math.max(0,Math.min(brief.size.rows,Math.round(p.y/CELL)))}}

function SiteCanvas({project,brief,activeFloor,mode,tool,commit,selected,setSelected,run,overlay,simPlaying,simSpeed,simTime,setSimTime,onMessage}) {
  const svgRef=useRef(null)
  const gesture=useRef(null)
  const [preview,setPreview]=useState(null)
  const floor=ensureFloorMeta(project.floors[activeFloor])

  useEffect(()=>{
    if(mode!=='simulate'||!simPlaying||!run)return
    let raf,last=performance.now(); const tick=(now)=>{const dt=(now-last)/1000;last=now;setSimTime(t=>t+dt*simSpeed);raf=requestAnimationFrame(tick)}
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)
  },[mode,simPlaying,simSpeed,run,setSimTime])

  const placeAt=(x,y)=>{
    if(mode!=='build')return
    const next=cloneProject(project),f=ensureFloorMeta(next.floors[activeFloor]),tk=tileKey(x,y)
    if(tool.kind==='fill'){
      const region=floodEnclosed(f,x,y,brief.size.cols,brief.size.rows)
      if(!region.closed){onMessage('Floor fill needs a closed wall loop. Close the room first.');return}
      for(const c of region.cells){f.tiles[tileKey(c.x,c.y)]='interior';f.finishes[tileKey(c.x,c.y)]=tool.finish||DEFAULT_FINISH.interior}
      commit(next);onMessage(`Filled ${region.cells.length} cells inside the closed room.`);return
    }
    if(tool.kind==='object'){
      const def=OBJECTS[tool.value]||{w:1,h:1},surface=['plant','bench','lamp','driveOrder','drivePickup'].includes(tool.value)?'path':'interior'
      if(x+(def.w||1)>brief.size.cols||y+(def.h||1)>brief.size.rows){onMessage('That item would extend beyond the site.');return}
      for(let oy=0;oy<(def.h||1);oy++)for(let ox=0;ox<(def.w||1);ox++){const ft=tileKey(x+ox,y+oy);if(!f.tiles[ft]){f.tiles[ft]=surface;f.finishes[ft]=DEFAULT_FINISH[surface]}}
      f.objects=f.objects.filter(o=>!(o.x===x&&o.y===y));f.objects.push({id:uid(tool.value),type:tool.value,x,y})
      if(tool.value==='stairs'){
        const other=ensureFloorMeta(next.floors[activeFloor===0?1:0]);if(!other.tiles[tk]){other.tiles[tk]='interior';other.finishes[tk]=DEFAULT_FINISH.interior}
        other.objects=other.objects.filter(o=>!(o.x===x&&o.y===y&&o.type==='stairs'));other.objects.push({id:uid('stairs'),type:'stairs',x,y})
      }
      commit(next);return
    }
    if(tool.kind==='select'){
      const obj=[...f.objects].reverse().find(o=>x>=o.x&&y>=o.y&&x<o.x+(OBJECTS[o.type]?.w||1)&&y<o.y+(OBJECTS[o.type]?.h||1))
      setSelected(obj||{kind:'tile',x,y,type:f.tiles[tk]||'empty',finish:f.finishes[tk]});return
    }
    if(tool.kind==='erase'){
      delete f.tiles[tk];delete f.finishes[tk];f.objects=f.objects.filter(o=>!(x>=o.x&&y>=o.y&&x<o.x+(OBJECTS[o.type]?.w||1)&&y<o.y+(OBJECTS[o.type]?.h||1)));commit(next)
    }
  }

  const pointerDown=(e)=>{
    if(mode!=='build'||viewOnlyTool(tool))return
    const svg=svgRef.current,p=getSvgPoint(e,svg);svg.setPointerCapture?.(e.pointerId)
    if(tool.kind==='wall'){const start=localVertex(p,brief);gesture.current={kind:'wall',start};setPreview({kind:'wall',start,end:start});return}
    if(tool.kind==='room'||tool.kind==='area'){const start=localCell(p,brief);gesture.current={kind:tool.kind,start};setPreview({kind:tool.kind,start,end:start});return}
    const c=localCell(p,brief);placeAt(c.x,c.y)
  }
  const pointerMove=(e)=>{
    if(!gesture.current)return
    const p=getSvgPoint(e,svgRef.current)
    if(gesture.current.kind==='wall'){const raw=localVertex(p,brief),end=snapOrthogonal(gesture.current.start,raw);setPreview({...gesture.current,end})}
    else setPreview({...gesture.current,end:localCell(p,brief)})
  }
  const pointerUp=(e)=>{
    if(!gesture.current)return
    const g=gesture.current;gesture.current=null
    const next=cloneProject(project),f=ensureFloorMeta(next.floors[activeFloor])
    if(g.kind==='wall'&&preview?.end){applyWallSegment(f,g.start,preview.end,brief.size.cols,brief.size.rows,tool.finish||DEFAULT_FINISH.wall);commit(next)}
    if(g.kind==='room'&&preview?.end){const a=g.start,b=preview.end,x1=Math.min(a.x,b.x),x2=Math.max(a.x,b.x)+1,y1=Math.min(a.y,b.y),y2=Math.max(a.y,b.y)+1;if(x2-x1>1&&y2-y1>1){buildRectWalls(f,x1,y1,x2,y2,brief.size.cols,brief.size.rows,tool.finish||DEFAULT_FINISH.wall);commit(next)}}
    if(g.kind==='area'&&preview?.end){for(const c of rectangleCells(g.start,preview.end,brief.size.cols,brief.size.rows)){const tk=tileKey(c.x,c.y);f.tiles[tk]=tool.value;f.finishes[tk]=tool.finish||DEFAULT_FINISH[tool.value]}commit(next)}
    setPreview(null);try{svgRef.current?.releasePointerCapture?.(e.pointerId)}catch{}
  }
  const cancel=()=>{gesture.current=null;setPreview(null)}

  const heat=mode==='analyze'&&run?run.heatmaps[overlay]:null
  const maxHeat=heat?Math.max(1,...Object.entries(heat).filter(([k])=>k.startsWith(`${activeFloor}:`)).map(([,v])=>v)):1
  const width=brief.size.cols*CELL,height=brief.size.rows*CELL

  return <div className="site-frame" style={{width,height}}>
    <div className="site-title-row"><span>{brief.lot} · {brief.cellMeters} m grid</span><span>Floor {activeFloor+1}</span></div>
    <svg ref={svgRef} className="site-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMin meet" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={cancel} onPointerLeave={e=>{if(e.buttons===0)cancel()}}>
      <defs><PlanPatterns/><pattern id="minorGrid" width={CELL} height={CELL} patternUnits="userSpaceOnUse"><path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="#aeb6af" strokeWidth="0.7"/></pattern><filter id="agentShadow"><feDropShadow dx="0" dy="2" stdDeviation="1.2" floodOpacity=".22"/></filter></defs>
      <rect x="0" y="0" width={width} height={height} className="lot-bg"/><rect x="0" y="0" width={width} height={height} fill="url(#minorGrid)"/>
      {Array.from({length:brief.size.rows},(_,y)=>Array.from({length:brief.size.cols},(_,x)=>{
        const tk=tileKey(x,y),type=floor.tiles[tk]||'empty',finish=floor.finishes[tk]||DEFAULT_FINISH[type],k=key(x,y,activeFloor),hv=heat?.[k]||0,opacity=heat?Math.min(.78,.08+hv/maxHeat*.7):0
        return <g key={`${x}-${y}`}>{type!=='empty'&&<rect x={x*CELL+.5} y={y*CELL+.5} width={CELL-1} height={CELL-1} style={{fill:`url(#finish-${finish})`}} className={`zone ${type}`}/>} {heat&&type!=='empty'&&<rect x={x*CELL+1} y={y*CELL+1} width={CELL-2} height={CELL-2} className={`heat heat-${overlay}`} opacity={opacity}/>}</g>
      }))}
      {Object.keys(floor.walls).map((edge,i)=><WallLine key={edge} edge={edge} finish={floor.wallFinishes[edge]||DEFAULT_FINISH.wall}/>) }
      {floor.objects.map(o=><ObjectGlyph key={o.id} object={o} selected={selected?.id===o.id}/>)}
      <GesturePreview preview={preview} tool={tool}/>
      {mode==='simulate'&&run&&<><AgentLayer routes={run.animatedRoutes} time={simTime} activeFloor={activeFloor}/><VehicleLayer route={run.vehicleRoute} time={simTime} activeFloor={activeFloor}/></>}
    </svg>
    <RoadReference cols={brief.size.cols}/>
  </div>
}
function viewOnlyTool(tool){return !tool||!['wall','room','area','fill','object','select','erase'].includes(tool.kind)}

function PlanPatterns(){
  const surfaces=['interior','patio','path','drive','parking'];const variants=[...surfaces.flatMap(s=>Object.values(FINISH_LIBRARY[s]||{}).flat())]
  return <>{variants.map(v=><pattern id={`finish-${v.id}`} key={v.id} width={v.texture==='boards'?18:12} height={v.texture==='boards'?8:12} patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill={v.base}/>{v.texture==='brick'||v.texture==='pavers'?<><path d="M0 0H12M0 6H12M0 12H12M6 0V6M3 6V12" stroke={v.line} strokeWidth=".65" opacity=".55"/></>:v.texture==='boards'?<><path d="M0 0H18M0 8H18M6 0V8M14 0V8" stroke={v.line} strokeWidth=".55" opacity=".5"/></>:v.texture==='tile'||v.texture==='grid'?<path d="M0 0H12V12H0Z" fill="none" stroke={v.line} strokeWidth=".55" opacity=".45"/>:v.texture==='speckle'?<><circle cx="3" cy="4" r=".7" fill={v.line} opacity=".55"/><circle cx="9" cy="8" r=".55" fill={v.line} opacity=".45"/></>:null}</pattern>)}</>
}

function parseEdge(edge){const [a,b]=edge.split('|').map(s=>s.split(',').map(Number));return {a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}}}
function edgePlanVertices(edge){const {a,b}=parseEdge(edge);if(a.x!==b.x){const x=Math.max(a.x,b.x),y=a.y;return [{x,y},{x,y:y+1}]}const x=a.x,y=Math.max(a.y,b.y);return [{x,y},{x:x+1,y}]}
function WallLine({edge,finish}){const [a,b]=edgePlanVertices(edge),f=finishById('wall',finish);return <g className="wall-render"><line x1={a.x*CELL} y1={a.y*CELL} x2={b.x*CELL} y2={b.y*CELL} stroke={f.line} strokeWidth="5"/><line x1={a.x*CELL} y1={a.y*CELL} x2={b.x*CELL} y2={b.y*CELL} stroke={f.base} strokeWidth="3"/></g>}
function GesturePreview({preview,tool}){if(!preview)return null;if(preview.kind==='wall'){const a=preview.start,b=preview.end,f=finishById('wall',tool.finish||DEFAULT_FINISH.wall);return <line className="gesture-preview" x1={a.x*CELL} y1={a.y*CELL} x2={b.x*CELL} y2={b.y*CELL} stroke={f.base}/>}const a=preview.start,b=preview.end,x=Math.min(a.x,b.x)*CELL,y=Math.min(a.y,b.y)*CELL,w=(Math.abs(a.x-b.x)+1)*CELL,h=(Math.abs(a.y-b.y)+1)*CELL;return <rect className="area-preview" x={x} y={y} width={w} height={h}/>}

function ObjectGlyph({object,selected}) {
  const def=OBJECTS[object.type]||{w:1,h:1,icon:'?'};const w=(def.w||1)*CELL,h=(def.h||1)*CELL,x=object.x*CELL,y=object.y*CELL,cx=x+w/2,cy=y+h/2
  if(object.type==='table')return <g className={`object furniture table-object ${selected?'selected':''}`}><rect x={x+CELL*.45} y={y+CELL*.3} width={w-CELL*.9} height={h-CELL*.6} rx="4"/><circle cx={x+CELL*.4} cy={cy} r="5"/><circle cx={x+w-CELL*.4} cy={cy} r="5"/><circle cx={cx} cy={y+4} r="5"/><circle cx={cx} cy={y+h-4} r="5"/><text x={cx} y={cy+3} textAnchor="middle">T</text></g>
  if(object.type==='plant')return <g className={`object plant-object ${selected?'selected':''}`}><circle cx={cx} cy={cy} r={CELL*.34}/><path d={`M${cx} ${cy+6}q-8-10 0-14q8 4 0 14`} /><text x={cx} y={cy+4} textAnchor="middle">✦</text></g>
  return <g className={`object ${['register','pickup','prep','toilet'].includes(object.type)?'service':''} ${selected?'selected':''}`}><rect x={x+3} y={y+3} width={Math.max(12,w-6)} height={Math.max(12,h-6)} rx="4"/><text x={cx} y={cy+4} textAnchor="middle">{def.icon}</text></g>
}

function AgentLayer({routes,time,activeFloor}) {return <g className="agents">{routes.map((a,i)=>{const route=a.route.filter(p=>p.floor===activeFloor);if(route.length<2)return null;const t=Math.max(0,time*a.speed-a.offset);if(t<0)return null;const idx=Math.floor(t)%route.length,next=(idx+1)%route.length,frac=t-Math.floor(t),p=route[idx],q=route[next],x=(p.x+.5+(q.x-p.x)*frac)*CELL,y=(p.y+.5+(q.y-p.y)*frac)*CELL;return <circle key={i} cx={x} cy={y} r="4.2" className={`agent-dot a${i%4}`} filter="url(#agentShadow)"/>})}</g>}
function VehicleLayer({route=[],time,activeFloor}) {if(activeFloor!==0||route.length<2)return null;return <g className="vehicles">{[0,1,2,3,4,5].map((_,i)=>{const t=Math.max(0,time*.52-i*3.2);if(t<=0)return null;const idx=Math.floor(t)%route.length,next=(idx+1)%route.length,frac=t-Math.floor(t),p=route[idx],q=route[next],x=(p.x+.5+(q.x-p.x)*frac)*CELL,y=(p.y+.5+(q.y-p.y)*frac)*CELL,h=Math.abs(q.x-p.x)>=Math.abs(q.y-p.y);return <rect key={i} x={x-(h?8:4)} y={y-(h?4:8)} width={h?16:8} height={h?8:16} rx="2" className={`vehicle v${i%3}`}/>})}</g>}

function RoadReference({cols}) {const width=cols*CELL;return <div className="road-reference" style={{width}}><div className="sidewalk top">SIDEWALK · 2 CELLS</div><div className="road-lane lane-a"><span>← 4-CELL LANE</span></div><div className="road-lane lane-b"><span>4-CELL LANE →</span></div><div className="sidewalk bottom">SIDEWALK · 2 CELLS</div></div>}

function SectionView({project,brief}) {
  return <div className="section-stage"><div className="section-sky"><Sun size={22}/><span>SECTION / CUTAWAY</span></div>{[1,0].map(fi=>{const f=ensureFloorMeta(project.floors[fi]);const cells=Object.keys(f.tiles).length;return <div className="section-floor" key={fi}><div className="section-label">FLOOR {fi+1}</div><div className="section-slab" style={{width:`${Math.max(18,Math.min(92,cells/8))}%`}}/><div className="section-objects">{f.objects.map(o=><div key={o.id} className={`section-object ${o.type}`} style={{left:`${Math.min(92,(o.x/brief.size.cols)*100)}%`}} title={OBJECTS[o.type]?.label}><span>{OBJECTS[o.type]?.icon}</span></div>)}</div></div>})}<div className="section-ground"><span>site datum ±0.00</span></div><div className="section-note"><strong>Section is for vertical reasoning.</strong> Isometric is the presentation/inspection view; plan remains the precision editor.</div></div>
}

function isoPoint(x,y,z,brief){const tw=26,th=13,ox=620,oy=60;return {x:ox+(x-y)*tw/2,y:oy+(x+y)*th/2-z}}
function IsometricView({project,brief,activeFloor,isoMode}) {
  const floorIds=isoMode==='external'?[0,1]:[activeFloor]
  const rendered=[]
  for(const fi of floorIds){const f=ensureFloorMeta(project.floors[fi]);const z=isoMode==='external'?fi*62:0;const entries=Object.entries(f.tiles).sort(([ka],[kb])=>{const [ax,ay]=ka.split(':').map(Number),[bx,by]=kb.split(':').map(Number);return ax+ay-(bx+by)});for(const [tk,type] of entries){const [x,y]=tk.split(':').map(Number),p0=isoPoint(x,y,z,brief),p1=isoPoint(x+1,y,z,brief),p2=isoPoint(x+1,y+1,z,brief),p3=isoPoint(x,y+1,z,brief),fin=finishById(type,f.finishes[tk]||DEFAULT_FINISH[type]);rendered.push(<polygon key={`t-${fi}-${tk}`} points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill={fin.base} stroke={fin.line} className={`iso-tile iso-${type}`}/>)}for(const edge of Object.keys(f.walls)){const [a,b]=edgePlanVertices(edge),pa=isoPoint(a.x,a.y,z,brief),pb=isoPoint(b.x,b.y,z,brief),ta=isoPoint(a.x,a.y,z+42,brief),tb=isoPoint(b.x,b.y,z+42,brief),fin=finishById('wall',f.wallFinishes[edge]||DEFAULT_FINISH.wall);rendered.push(<polygon key={`w-${fi}-${edge}`} points={`${pa.x},${pa.y} ${pb.x},${pb.y} ${tb.x},${tb.y} ${ta.x},${ta.y}`} fill={fin.base} stroke={fin.line} className="iso-wall"/>)}for(const o of f.objects){rendered.push(<IsoObject key={`o-${fi}-${o.id}`} object={o} z={z} brief={brief}/>)}}
  return <div className="iso-stage"><svg viewBox="0 0 1180 660" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="isoSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dfe7e7"/><stop offset="1" stopColor="#eef0ea"/></linearGradient></defs><rect width="1180" height="660" fill="url(#isoSky)"/><ellipse cx="590" cy="540" rx="460" ry="80" fill="#a5aaa3" opacity=".18"/>{rendered}</svg><div className="iso-caption"><Building2/><div><strong>{isoMode==='external'?'Exterior model':`Floor ${activeFloor+1} model`}</strong><span>Generated from the same plan — no separate model to maintain.</span></div></div></div>
}
function IsoObject({object,z,brief}){const def=OBJECTS[object.type]||{w:1,h:1,icon:'?'};const p=isoPoint(object.x+(def.w||1)/2,object.y+(def.h||1)/2,z+8,brief);if(object.type==='plant')return <g><circle cx={p.x} cy={p.y-10} r="8" fill="#557762"/><rect x={p.x-2} y={p.y-3} width="4" height="11" fill="#6a5945"/></g>;const width=Math.max(10,(def.w||1)*9),height=object.type==='stairs'?20:12;return <g className="iso-object"><rect x={p.x-width/2} y={p.y-height} width={width} height={height} rx="2"/><text x={p.x} y={p.y-height/2+3} textAnchor="middle">{def.icon}</text></g>}
function IsoFloorControl({activeFloor,setActiveFloor,isoMode,setIsoMode}){return <div className="iso-floor-control"><button className={isoMode==='external'?'active':''} onClick={()=>setIsoMode('external')}>Exterior</button><button className={isoMode==='floor'&&activeFloor===0?'active':''} onClick={()=>{setIsoMode('floor');setActiveFloor(0)}}>Floor 1</button><button className={isoMode==='floor'&&activeFloor===1?'active':''} onClick={()=>{setIsoMode('floor');setActiveFloor(1)}}>Floor 2</button></div>}

function CanvasHud({brief,project,run,mode,activeFloor,view}) {const objects=project.floors.flatMap(f=>f.objects),cells=project.floors.reduce((s,f)=>s+Object.values(f.tiles).filter(t=>['interior','patio'].includes(t)).length,0),area=Math.round(cells*(brief.cellMeters||1)**2);return <div className="canvas-hud"><div><span className="eyebrow">{view.toUpperCase()} · {mode.toUpperCase()}</span><strong>{brief.title}</strong></div><div className="hud-metrics"><span><Grid3X3/> {area} m²</span><span><Armchair/> {objects.filter(o=>o.type==='table').length*4} seats</span>{run&&<span><Users/> {run.metrics.throughput}% served</span>}<span><Layers3/> F{activeFloor+1}</span></div></div>}
function SimControls({run,playing,setPlaying,speed,setSpeed}) {return <div className="sim-controls"><button onClick={()=>setPlaying(!playing)}>{playing?<Pause/>:<Play/>}</button><span className="live-dot"/><strong>OPEN</strong><span>{run.metrics.served}/{run.metrics.arrivals} served</span><span>{run.metrics.avgWait} min avg wait</span><div className="speed-buttons">{[1,2,5].map(s=><button className={speed===s?'active':''} onClick={()=>setSpeed(s)} key={s}>{s}×</button>)}</div></div>}


function OverlayPicker({overlay,setOverlay}) {
  const items=[['circulation','Routes',Route],['congestion','Congestion',Gauge],['utilization','Utilization',Armchair],['daylight','Daylight',Sun]]
  return <div className="overlay-picker">{items.map(([id,label,Icon])=><button className={overlay===id?'active':''} onClick={()=>setOverlay(id)} key={id}><Icon/>{label}</button>)}</div>
}

function RightPanel({project,brief,selected,activeFloor,commit,validation,run,previousRun,mode,overlay,setOverlay,rating,setRating,note,setNote,archive,seed,setSeed}) {
  if (mode==='analyze' && run) return <AnalysisPanel run={run} overlay={overlay} setOverlay={setOverlay}/>
  if (mode==='review' && run) return <ReviewPanel run={run} previousRun={previousRun} rating={rating} setRating={setRating} note={note} setNote={setNote} archive={archive}/>
  if (mode==='simulate' && run) return <LivePanel run={run} seed={seed} setSeed={setSeed}/>
  return <aside className="right-panel">
    <div className="right-head"><span className="eyebrow">BRIEF</span><h3>{brief.title}</h3><p>{brief.subtitle}</p></div>
    <Requirements project={project} brief={brief} validation={validation}/>
    {selected && <SelectedInspector project={project} selected={selected} activeFloor={activeFloor} commit={commit}/>} 
    <div className="panel-block"><span className="panel-label">DESIGN PRESSURES</span>{brief.tensions.map(t=><div className="pressure" key={t}><ChevronRight/>{t}</div>)}</div>
    <div className="panel-block tip"><Sparkles/><div><strong>Design, then test.</strong><p>Use the same seed after a revision. A better plan should change the behavior, not just the look.</p></div></div>
  </aside>
}

function Requirements({project,brief,validation}) {
  const present=new Set(project.floors.flatMap(f=>f.objects.map(o=>o.type)))
  return <div className="panel-block"><div className="block-title"><span className="panel-label">REQUIREMENTS</span><span className={validation.ready?'ready':'not-ready'}>{validation.ready?'READY TO OPEN':'INCOMPLETE'}</span></div>
    <div className="requirements">{brief.required.map(r=><div key={r} className={present.has(r)?'done':''}><span>{present.has(r)?<Check/>:<span className="req-dot"/>}</span>{OBJECTS[r]?.label||r}</div>)}</div>
    {brief.id==='drive' && <div className="micro-note">Drive-through also needs at least 32 lane cells — roughly one useful four-cell-wide lane segment.</div>}
  </div>
}

function SelectedInspector({project,selected,activeFloor,commit}) {
  const remove=()=>{ const next=cloneProject(project); next.floors[activeFloor].objects=next.floors[activeFloor].objects.filter(o=>o.id!==selected.id); commit(next) }
  return <div className="panel-block selected-inspector"><span className="panel-label">SELECTED</span><div className="selected-title"><span className="object-glyph large">{OBJECTS[selected.type]?.icon || '·'}</span><div><strong>{OBJECTS[selected.type]?.label||selected.type}</strong><p>Grid {selected.x+1}, {selected.y+1} · Floor {activeFloor+1}</p></div></div>{selected.id&&<button className="danger subtle" onClick={remove}><Trash2/> Remove object</button>}</div>
}

function LivePanel({run,seed,setSeed}) {
  const m=run.metrics
  return <aside className="right-panel"><div className="right-head"><span className="eyebrow">LIVE DAY</span><h3>{m.served} customers served</h3><p>Every dot follows a purposeful itinerary through your actual plan.</p></div>
    <MetricGrid m={m}/>
    <div className="panel-block"><span className="panel-label">DETERMINISTIC DEMAND</span><label className="seed-row">Seed <input type="number" value={seed} onChange={e=>setSeed(Number(e.target.value)||1)}/></label><p className="micro-note">Keep the seed unchanged when revising the building for a fair A/B comparison.</p></div>
    <div className="panel-block"><span className="panel-label">LIVE OBSERVATIONS</span>{run.findings.slice(0,4).map((f,i)=><Finding key={i} f={f}/>)}</div>
  </aside>
}

function AnalysisPanel({run,overlay,setOverlay}) {
  const m=run.metrics
  return <aside className="right-panel"><div className="right-head"><span className="eyebrow">SPATIAL ANALYSIS</span><h3>Read the building</h3><p>Select a layer. The colored cells point back to the physical places creating the metric.</p></div>
    <div className="analysis-tabs">{[['circulation','Routes',Route],['congestion','Congestion',Gauge],['utilization','Use',Armchair],['daylight','Daylight',Sun]].map(([id,l,I])=><button key={id} className={overlay===id?'active':''} onClick={()=>setOverlay(id)}><I/>{l}</button>)}</div>
    <MetricGrid m={m}/>
    <div className="panel-block"><span className="panel-label">FINDINGS</span>{run.findings.map((f,i)=><Finding key={i} f={f}/>)}</div>
  </aside>
}

function MetricGrid({m}) {
  return <div className="metric-grid"><Metric icon={<Users/>} label="Throughput" value={`${m.throughput}%`}/><Metric icon={<Clock3/>} label="Avg wait" value={`${m.avgWait} min`}/><Metric icon={<Route/>} label="Route" value={`${m.avgRoute} m`}/><Metric icon={<Sun/>} label="Daylight" value={`${m.daylight}/100`}/><Metric icon={<Armchair/>} label="Seat use" value={`${m.seatUtil}%`}/><Metric icon={<CircleDollarSign/>} label="Build" value={money(m.buildCost)}/></div>
}
function Metric({icon,label,value}) { return <div className="metric"><span>{icon}{label}</span><strong>{value}</strong></div> }
function Finding({f}) { return <div className={`finding ${f.severity}`}><span className="finding-icon">{f.severity==='good'?<Check/>:f.severity==='critical'?<X/>:<AlertTriangle/>}</span><div><strong>{f.title}</strong><p>{f.text}</p></div></div> }

function ReviewPanel({run,previousRun,rating,setRating,note,setNote,archive}) {
  const m=run.metrics, p=previousRun?.metrics
  const compare=(field,inverse=false)=>{
    if(!p)return null; const delta=m[field]-p[field]; const good=inverse?delta<0:delta>0
    if(delta===0)return <span className="delta neutral">—</span>
    return <span className={`delta ${good?'good':'bad'}`}>{delta>0?'+':''}{Number(delta.toFixed?.(1)??delta)}</span>
  }
  return <aside className="right-panel review-panel"><div className="right-head"><span className="eyebrow">PROJECT REVIEW</span><h3>What changed?</h3><p>{previousRun?'Same project, compared with your previous run.':'This is the first measured version of this project.'}</p></div>
    <div className="compare-table"><div className="compare-head"><span>Metric</span><span>Previous</span><span>Now</span><span>Δ</span></div>
      <CompareRow label="Throughput" prev={p?`${p.throughput}%`:'—'} now={`${m.throughput}%`} delta={compare('throughput')}/>
      <CompareRow label="Average wait" prev={p?`${p.avgWait}m`:'—'} now={`${m.avgWait}m`} delta={compare('avgWait',true)}/>
      <CompareRow label="Route length" prev={p?`${p.avgRoute} m`:'—'} now={`${m.avgRoute} m`} delta={compare('avgRoute',true)}/>
      <CompareRow label="Staff travel" prev={p?`${p.staffDistance} m`:'—'} now={`${m.staffDistance} m`} delta={compare('staffDistance',true)}/>
      <CompareRow label="Daylight" prev={p?`${p.daylight}`:'—'} now={`${m.daylight}`} delta={compare('daylight')}/>
    </div>
    <div className="panel-block"><span className="panel-label">DESIGN REVIEW</span>{run.findings.map((f,i)=><Finding f={f} key={i}/>)}</div>
    <div className="panel-block personal-review"><span className="panel-label">YOUR JUDGMENT</span><div className="stars">{[1,2,3,4,5].map(s=><button key={s} className={s<=rating?'on':''} onClick={()=>setRating(s)}><Star/></button>)}</div><textarea placeholder="What do you like? What would you change next time?" value={note} onChange={e=>setNote(e.target.value)}/><button className="primary full" onClick={archive}><Save/> Save to portfolio</button></div>
  </aside>
}
function CompareRow({label,prev,now,delta}) { return <div className="compare-row"><span>{label}</span><span>{prev}</span><strong>{now}</strong><span>{delta}</span></div> }

export default App
