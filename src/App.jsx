import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, BarChart3, Building2, Check, ChevronRight, CircleDollarSign, Clock3,
  Copy, Eraser, Eye, FastForward, Grid3X3, Hammer, Home, Layers3, MousePointer2,
  Pause, Play, RotateCcw, Save, Sparkles, Star, Trash2, Undo2, Redo2, Users,
  Route, Sun, Armchair, AlertTriangle, CarFront, Coffee, PanelTop, Gauge, X
} from './Icons'
import { BRIEFS, DEFAULT_PROJECTS, OBJECTS, TILE } from './game/catalog'
import { cloneProject, edgeKey, isWalkableTile, key, tileKey } from './engine/grid'
import { runSimulation, validateProject } from './engine/sim'

const STORAGE_KEY = 'built-poc-portfolio-v2'
const CELL = 34

function uid(prefix='id') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}` }
function money(v=0) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v) }

function blankProject(type) {
  const base = cloneProject(DEFAULT_PROJECTS[type])
  return { id: uid(type), type, name: BRIEFS[type].title, ...base, history: [], runs: [], createdAt: Date.now() }
}

function starterProject(type) {
  const p = blankProject(type)
  if (type === 'coffee') {
    const f = p.floors[0]
    for (let y=3;y<=10;y++) for (let x=3;x<=14;x++) f.tiles[tileKey(x,y)] = 'interior'
    for (let y=5;y<=8;y++) for (let x=1;x<=2;x++) f.tiles[tileKey(x,y)] = 'path'
    for (let x=8;x<=13;x++) f.tiles[tileKey(x,11)] = 'patio'
    f.objects = [
      {id:uid(),type:'entrance',x:3,y:6},{id:uid(),type:'register',x:6,y:5},
      {id:uid(),type:'pickup',x:8,y:5},{id:uid(),type:'prep',x:9,y:4},
      {id:uid(),type:'table',x:11,y:5},{id:uid(),type:'table',x:12,y:8},
      {id:uid(),type:'table',x:9,y:9},{id:uid(),type:'toilet',x:13,y:9},
      {id:uid(),type:'trash',x:10,y:4},{id:uid(),type:'window',x:11,y:3},
      {id:uid(),type:'window',x:13,y:3},{id:uid(),type:'plant',x:8,y:11},
    ]
  } else {
    const f = p.floors[0]
    for (let y=4;y<=11;y++) for (let x=7;x<=16;x++) f.tiles[tileKey(x,y)] = 'interior'
    for (let x=2;x<=20;x++) { f.tiles[tileKey(x,2)]='drive'; f.tiles[tileKey(x,13)]='drive' }
    for (let y=2;y<=13;y++) { f.tiles[tileKey(20,y)]='drive' }
    for (let x=4;x<=6;x++) for (let y=6;y<=9;y++) f.tiles[tileKey(x,y)]='parking'
    for (let x=3;x<=7;x++) f.tiles[tileKey(x,10)]='path'
    f.objects = [
      {id:uid(),type:'entrance',x:7,y:9},{id:uid(),type:'register',x:9,y:8},
      {id:uid(),type:'pickup',x:12,y:8},{id:uid(),type:'prep',x:13,y:7},
      {id:uid(),type:'table',x:9,y:5},{id:uid(),type:'table',x:11,y:5},
      {id:uid(),type:'toilet',x:15,y:10},{id:uid(),type:'driveOrder',x:16,y:2},
      {id:uid(),type:'drivePickup',x:16,y:6},{id:uid(),type:'window',x:10,y:4},
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
        <div className="eyebrow">ARCHITECTURE SANDBOX / POC 0.2</div>
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
  const [view, setView] = useState('floor')
  const [tool, setTool] = useState({kind:'select', value:null})
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
  const validation = useMemo(()=>validateProject(project,brief),[project,brief])

  const commit = (next) => {
    setHistory(h => [...h.slice(-39), cloneProject(project)])
    setFuture([])
    setProject(next)
  }
  const undo = () => {
    if (!history.length) return
    const prior = history.at(-1)
    setFuture(f => [cloneProject(project), ...f])
    setHistory(h => h.slice(0,-1))
    setProject(prior)
  }
  const redo = () => {
    if (!future.length) return
    const next = future[0]
    setHistory(h => [...h, cloneProject(project)])
    setFuture(f => f.slice(1))
    setProject(next)
  }

  const simulate = () => {
    const nextRun = runSimulation(project, brief, seed)
    setPreviousRun(run)
    setRun(nextRun)
    setProject(p => ({...p, runs:[...(p.runs||[]),nextRun].slice(-8)}))
    setMode('simulate'); setSimTime(0); setSimPlaying(true)
    setToast(nextRun.validation.ready ? 'Building opened with the same deterministic demand seed.' : 'Simulation ran, but the brief still has missing functions.')
    setTimeout(()=>setToast(null), 2800)
  }

  const archive = () => {
    if (!run) return
    const entry = { id: project.id, name: project.name, type: project.type, rating, note, savedAt:Date.now(), project: cloneProject(project), run }
    onSavePortfolio(entry)
    setToast('Saved to your portfolio as a project snapshot.')
    setTimeout(()=>setToast(null),2500)
  }

  return <div className="app project-shell">
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    <header className="project-topbar">
      <button className="icon-button" onClick={onBack} title="Back to projects"><ArrowLeft/></button>
      <div className="project-identity"><span className="brand-mini">B</span><div><span className="eyebrow">{brief.accent}</span><input value={project.name} onChange={e=>setProject({...project,name:e.target.value})}/></div></div>
      <div className="mode-switch">
        <button className={mode==='build'?'active':''} onClick={()=>setMode('build')}><Hammer/>Build</button>
        <button className={mode==='simulate'?'active':''} onClick={()=>setMode('simulate')}><Play/>Simulate</button>
        <button className={mode==='analyze'?'active':''} onClick={()=>setMode('analyze')} disabled={!run}><BarChart3/>Analyze</button>
        <button className={mode==='review'?'active':''} onClick={()=>setMode('review')} disabled={!run}><PanelTop/>Review</button>
      </div>
      <div className="top-actions">
        <button className="icon-button" onClick={undo} disabled={!history.length}><Undo2/></button>
        <button className="icon-button" onClick={redo} disabled={!future.length}><Redo2/></button>
        <button className="primary" onClick={simulate}><Play size={16}/> Open building</button>
      </div>
    </header>

    <div className="project-body">
      <LeftPanel tool={tool} setTool={setTool} projectType={project.type} activeFloor={activeFloor} setActiveFloor={setActiveFloor} view={view} setView={setView}/>
      <main className="canvas-wrap">
        {view === 'section' ? <SectionView project={project} brief={brief}/> :
          <SiteCanvas project={project} brief={brief} activeFloor={activeFloor} mode={mode} tool={tool} commit={commit} selected={selected} setSelected={setSelected} run={run} overlay={overlay} simPlaying={simPlaying} simSpeed={simSpeed} simTime={simTime} setSimTime={setSimTime}/>
        }
        <CanvasHud brief={brief} project={project} run={run} mode={mode} activeFloor={activeFloor}/>
        {mode==='simulate' && run && <SimControls run={run} playing={simPlaying} setPlaying={setSimPlaying} speed={simSpeed} setSpeed={setSimSpeed}/>} 
        {mode==='analyze' && run && <OverlayPicker overlay={overlay} setOverlay={setOverlay}/>} 
      </main>
      <RightPanel project={project} brief={brief} selected={selected} activeFloor={activeFloor} commit={commit} validation={validation} run={run} previousRun={previousRun} mode={mode} overlay={overlay} setOverlay={setOverlay} rating={rating} setRating={setRating} note={note} setNote={setNote} archive={archive} seed={seed} setSeed={setSeed}/>
    </div>
  </div>
}

function LeftPanel({tool,setTool,projectType,activeFloor,setActiveFloor,view,setView}) {
  const objectEntries = Object.entries(OBJECTS).filter(([type,o]) => projectType==='drive' || !['driveOrder','drivePickup'].includes(type))
  const grouped = objectEntries.reduce((a,[k,v])=>{(a[v.category] ||= []).push([k,v]); return a},{})
  return <aside className="left-panel">
    <div className="panel-section view-tabs">
      <button className={view==='floor'?'active':''} onClick={()=>setView('floor')}><Grid3X3/>Plan</button>
      <button className={view==='section'?'active':''} onClick={()=>setView('section')}><Layers3/>Section</button>
    </div>
    <div className="panel-section floor-tabs"><span className="panel-label">FLOOR</span><div><button className={activeFloor===0?'active':''} onClick={()=>setActiveFloor(0)}>01</button><button className={activeFloor===1?'active':''} onClick={()=>setActiveFloor(1)}>02</button></div></div>
    <div className="panel-section">
      <span className="panel-label">DRAW</span>
      <div className="tool-grid">
        <ToolButton active={tool.kind==='select'} onClick={()=>setTool({kind:'select'})} icon={<MousePointer2/>} label="Select"/>
        <ToolButton active={tool.kind==='erase'} onClick={()=>setTool({kind:'erase'})} icon={<Eraser/>} label="Erase"/>
        {Object.entries(TILE).filter(([k])=>k!=='empty').map(([k,v])=><ToolButton key={k} active={tool.kind==='tile'&&tool.value===k} onClick={()=>setTool({kind:'tile',value:k})} icon={<span className={`tile-dot ${k}`}/>} label={v.label}/>) }
        <ToolButton active={tool.kind==='wall'} onClick={()=>setTool({kind:'wall'})} icon={<span className="wall-icon"/>} label="Wall"/>
      </div>
    </div>
    {Object.entries(grouped).map(([cat,items])=><div className="panel-section" key={cat}><span className="panel-label">{cat.toUpperCase()}</span><div className="object-list">
      {items.map(([k,o])=><button key={k} className={tool.kind==='object'&&tool.value===k?'active':''} onClick={()=>setTool({kind:'object',value:k})}><span className="object-glyph">{o.icon}</span><span>{o.label}</span></button>)}
    </div></div>)}
  </aside>
}

function ToolButton({active,onClick,icon,label}) { return <button className={`tool-button ${active?'active':''}`} onClick={onClick}>{icon}<span>{label}</span></button> }

function SiteCanvas({project,brief,activeFloor,mode,tool,commit,selected,setSelected,run,overlay,simPlaying,simSpeed,simTime,setSimTime}) {
  const svgRef = useRef(null)
  const dragRef = useRef(false)
  const floor = project.floors[activeFloor]
  const [wallStart,setWallStart] = useState(null)

  useEffect(()=>{
    if (mode!=='simulate' || !simPlaying || !run) return
    let raf, last=performance.now()
    const tick=(now)=>{ const dt=(now-last)/1000; last=now; setSimTime(t=>t+dt*simSpeed); raf=requestAnimationFrame(tick) }
    raf=requestAnimationFrame(tick); return ()=>cancelAnimationFrame(raf)
  },[mode,simPlaying,simSpeed,run,setSimTime])

  const mutateCell = (x,y) => {
    if (mode!=='build') return
    const next = cloneProject(project); const f = next.floors[activeFloor]; const tk=tileKey(x,y)
    if (tool.kind==='tile') f.tiles[tk]=tool.value
    else if (tool.kind==='erase') {
      delete f.tiles[tk]; f.objects=f.objects.filter(o=>o.x!==x||o.y!==y)
    } else if (tool.kind==='object') {
      if (!f.tiles[tk]) f.tiles[tk] = ['plant','driveOrder','drivePickup'].includes(tool.value) ? 'path':'interior'
      f.objects=f.objects.filter(o=>!(o.x===x&&o.y===y))
      f.objects.push({id:uid(tool.value),type:tool.value,x,y})
      if (tool.value==='stairs') {
        const other=next.floors[activeFloor===0?1:0]
        if (!other.tiles[tk]) other.tiles[tk]='interior'
        other.objects=other.objects.filter(o=>!(o.x===x&&o.y===y&&o.type==='stairs'))
        other.objects.push({id:uid('stairs'),type:'stairs',x,y})
      }
    } else if (tool.kind==='select') {
      const obj=f.objects.find(o=>o.x===x&&o.y===y); setSelected(obj||{kind:'tile',x,y,type:f.tiles[tk]||'empty'}); return
    } else if (tool.kind==='wall') {
      if (!wallStart) { setWallStart({x,y}); return }
      const dx=Math.abs(wallStart.x-x),dy=Math.abs(wallStart.y-y)
      if (dx+dy===1) {
        const ek=edgeKey(wallStart.x,wallStart.y,x,y)
        if (f.walls[ek]) delete f.walls[ek]; else f.walls[ek]=true
        setWallStart(null)
      } else setWallStart({x,y})
    }
    commit(next)
  }

  const onPointerDown=(x,y)=>{dragRef.current=true; mutateCell(x,y)}
  const onPointerEnter=(x,y)=>{ if(dragRef.current && ['tile','erase'].includes(tool.kind)) mutateCell(x,y) }
  const stopDrag=()=>{dragRef.current=false}

  const heat = mode==='analyze' && run ? run.heatmaps[overlay] : null
  const maxHeat = heat ? Math.max(1,...Object.entries(heat).filter(([k])=>k.startsWith(`${activeFloor}:`)).map(([,v])=>v)) : 1
  const width=brief.size.cols*CELL, height=brief.size.rows*CELL

  return <div className="site-frame" onPointerUp={stopDrag} onPointerLeave={stopDrag}>
    <div className="site-title-row"><span>{brief.lot}</span><span>Floor {activeFloor+1}</span></div>
    <svg ref={svgRef} className="site-svg" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <pattern id="minorGrid" width={CELL} height={CELL} patternUnits="userSpaceOnUse"><path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="#cbd0ca" strokeWidth="0.65"/></pattern>
        <filter id="agentShadow"><feDropShadow dx="0" dy="2" stdDeviation="1.2" floodOpacity=".22"/></filter>
      </defs>
      <rect x="0" y="0" width={width} height={height} className="lot-bg"/>
      <rect x="0" y="0" width={width} height={height} fill="url(#minorGrid)"/>
      {Array.from({length:brief.size.rows},(_,y)=>Array.from({length:brief.size.cols},(_,x)=>{
        const type=floor.tiles[tileKey(x,y)]||'empty'
        const k=key(x,y,activeFloor)
        const hv=heat?.[k]||0
        const opacity=heat ? Math.min(.78,.08+hv/maxHeat*.7) : 0
        return <g key={`${x}-${y}`}>
          {type!=='empty' && <rect x={x*CELL+1} y={y*CELL+1} width={CELL-2} height={CELL-2} className={`zone ${type}`}/>} 
          {heat && type!=='empty' && <rect x={x*CELL+2} y={y*CELL+2} width={CELL-4} height={CELL-4} rx="3" className={`heat heat-${overlay}`} opacity={opacity}/>} 
          <rect className="hit-cell" x={x*CELL} y={y*CELL} width={CELL} height={CELL} onPointerDown={()=>onPointerDown(x,y)} onPointerEnter={()=>onPointerEnter(x,y)} />
        </g>
      }))}
      {renderAutoExteriorWalls(floor, brief)}
      {Object.keys(floor.walls).map((ek,i)=><InternalWall key={i} edge={ek}/>)}
      {floor.objects.map(o=><ObjectGlyph key={o.id} object={o} selected={selected?.id===o.id} onClick={(e)=>{e.stopPropagation(); if(tool.kind==='select')setSelected(o)}}/>)}
      {wallStart && <circle cx={(wallStart.x+.5)*CELL} cy={(wallStart.y+.5)*CELL} r="6" className="wall-start"/>}
      {mode==='simulate' && run && <><AgentLayer routes={run.animatedRoutes} time={simTime} activeFloor={activeFloor}/><VehicleLayer route={run.vehicleRoute} time={simTime} activeFloor={activeFloor}/></>} 
    </svg>
    <div className="road-band"><div className="road-stripe"/><span>PUBLIC ROAD / SITE EDGE</span></div>
  </div>
}

function renderAutoExteriorWalls(floor,brief) {
  const lines=[]; let id=0
  const dirs=[[0,-1,'top'],[1,0,'right'],[0,1,'bottom'],[-1,0,'left']]
  for (const [tk,type] of Object.entries(floor.tiles)) {
    if (type!=='interior') continue
    const [x,y]=tk.split(':').map(Number)
    for (const [dx,dy,side] of dirs) {
      const nt=floor.tiles[tileKey(x+dx,y+dy)]
      if (nt==='interior') continue
      let x1=x*CELL,y1=y*CELL,x2=x1,y2=y1
      if(side==='top'){x2+=CELL}else if(side==='bottom'){y1+=CELL;y2+=CELL;x2+=CELL}else if(side==='left'){y2+=CELL}else {x1+=CELL;x2+=CELL;y2+=CELL}
      lines.push(<line key={id++} x1={x1} y1={y1} x2={x2} y2={y2} className="exterior-wall"/>)
    }
  }
  return lines
}

function InternalWall({edge}) {
  const [a,b]=edge.split('|').map(s=>s.split(',').map(Number)); const [x1,y1]=a,[x2,y2]=b
  const mx=(x1+x2+1)/2*CELL, my=(y1+y2+1)/2*CELL
  if (x1!==x2) return <line x1={mx} y1={Math.min(y1,y2)*CELL} x2={mx} y2={(Math.min(y1,y2)+1)*CELL} className="internal-wall"/>
  return <line x1={Math.min(x1,x2)*CELL} y1={my} x2={(Math.min(x1,x2)+1)*CELL} y2={my} className="internal-wall"/>
}

function ObjectGlyph({object,selected,onClick}) {
  const def=OBJECTS[object.type]; const cx=(object.x+.5)*CELL, cy=(object.y+.5)*CELL
  const service=['register','pickup','prep','toilet'].includes(object.type)
  return <g className={`object ${service?'service':''} ${selected?'selected':''}`} onPointerDown={onClick}>
    <rect x={object.x*CELL+5} y={object.y*CELL+5} width={CELL-10} height={CELL-10} rx="6"/>
    <text x={cx} y={cy+4} textAnchor="middle">{def?.icon||'?'}</text>
  </g>
}

function AgentLayer({routes,time,activeFloor}) {
  return <g className="agents">{routes.map((a,i)=>{
    const route=a.route.filter(p=>p.floor===activeFloor)
    if(route.length<2)return null
    const t=Math.max(0,time*a.speed-a.offset)
    if(t<0)return null
    const idx=Math.floor(t)%route.length, next=(idx+1)%route.length, frac=t-Math.floor(t)
    const p=route[idx],q=route[next]
    const x=(p.x+.5+(q.x-p.x)*frac)*CELL, y=(p.y+.5+(q.y-p.y)*frac)*CELL
    return <circle key={i} cx={x} cy={y} r="5.4" className={`agent-dot a${i%4}`} filter="url(#agentShadow)"/>
  })}</g>
}

function VehicleLayer({route=[],time,activeFloor}) {
  if (activeFloor !== 0 || route.length < 2) return null
  return <g className="vehicles">{[0,1,2,3,4,5].map((_,i)=>{
    const t=Math.max(0,time*.52-i*3.2); if(t<=0)return null
    const idx=Math.floor(t)%route.length,next=(idx+1)%route.length,frac=t-Math.floor(t)
    const p=route[idx],q=route[next]; const x=(p.x+.5+(q.x-p.x)*frac)*CELL,y=(p.y+.5+(q.y-p.y)*frac)*CELL
    const horizontal=Math.abs(q.x-p.x)>=Math.abs(q.y-p.y)
    return <rect key={i} x={x-(horizontal?9:5)} y={y-(horizontal?5:9)} width={horizontal?18:10} height={horizontal?10:18} rx="3" className={`vehicle v${i%3}`}/>
  })}</g>
}

function SectionView({project,brief}) {
  return <div className="section-stage">
    <div className="section-sky"><Sun size={22}/><span>SECTION / CUTAWAY</span></div>
    {[1,0].map(fi=><div className="section-floor" key={fi}>
      <div className="section-label">FLOOR {fi+1}</div>
      <div className="section-slab" style={{width:`${Math.max(26,Object.keys(project.floors[fi].tiles).length/3)}%`}}/>
      <div className="section-objects">{project.floors[fi].objects.map((o,i)=><div key={o.id} className={`section-object ${o.type}`} style={{left:`${Math.min(92,(o.x/brief.size.cols)*100)}%`}} title={OBJECTS[o.type]?.label}><span>{OBJECTS[o.type]?.icon}</span></div>)}</div>
    </div>)}
    <div className="section-ground"><span>site datum ±0.00</span></div>
    <div className="section-note">Place <strong>Stairs</strong> on either floor to create a linked vertical route. The tool automatically adds the matching stair landing.</div>
  </div>
}

function CanvasHud({brief,project,run,mode,activeFloor}) {
  const objects=project.floors.flatMap(f=>f.objects)
  const area=project.floors.reduce((s,f)=>s+Object.values(f.tiles).filter(t=>['interior','patio'].includes(t)).length,0)
  return <div className="canvas-hud">
    <div><span className="eyebrow">{mode.toUpperCase()}</span><strong>{brief.title}</strong></div>
    <div className="hud-metrics"><span><Grid3X3/> {area*4} m²</span><span><Armchair/> {objects.filter(o=>o.type==='table').length*4} seats</span>{run&&<span><Users/> {run.metrics.throughput}% served</span>}<span><Layers3/> F{activeFloor+1}</span></div>
  </div>
}

function SimControls({run,playing,setPlaying,speed,setSpeed}) {
  return <div className="sim-controls"><button onClick={()=>setPlaying(!playing)}>{playing?<Pause/>:<Play/>}</button><span className="live-dot"/><strong>OPEN</strong><span>{run.metrics.served}/{run.metrics.arrivals} served</span><span>{run.metrics.avgWait} min avg wait</span><div className="speed-buttons">{[1,2,5].map(s=><button className={speed===s?'active':''} onClick={()=>setSpeed(s)} key={s}>{s}×</button>)}</div></div>
}

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
    {brief.id==='drive' && <div className="micro-note">Drive-through also needs at least 8 lane tiles.</div>}
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
  return <div className="metric-grid"><Metric icon={<Users/>} label="Throughput" value={`${m.throughput}%`}/><Metric icon={<Clock3/>} label="Avg wait" value={`${m.avgWait}m`}/><Metric icon={<Route/>} label="Route" value={`${m.avgRoute} tiles`}/><Metric icon={<Sun/>} label="Daylight" value={`${m.daylight}/100`}/><Metric icon={<Armchair/>} label="Seat use" value={`${m.seatUtil}%`}/><Metric icon={<CircleDollarSign/>} label="Build" value={money(m.buildCost)}/></div>
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
      <CompareRow label="Route length" prev={p?`${p.avgRoute}`:'—'} now={`${m.avgRoute}`} delta={compare('avgRoute',true)}/>
      <CompareRow label="Staff travel" prev={p?`${p.staffDistance}`:'—'} now={`${m.staffDistance}`} delta={compare('staffDistance',true)}/>
      <CompareRow label="Daylight" prev={p?`${p.daylight}`:'—'} now={`${m.daylight}`} delta={compare('daylight')}/>
    </div>
    <div className="panel-block"><span className="panel-label">DESIGN REVIEW</span>{run.findings.map((f,i)=><Finding f={f} key={i}/>)}</div>
    <div className="panel-block personal-review"><span className="panel-label">YOUR JUDGMENT</span><div className="stars">{[1,2,3,4,5].map(s=><button key={s} className={s<=rating?'on':''} onClick={()=>setRating(s)}><Star/></button>)}</div><textarea placeholder="What do you like? What would you change next time?" value={note} onChange={e=>setNote(e.target.value)}/><button className="primary full" onClick={archive}><Save/> Save to portfolio</button></div>
  </aside>
}
function CompareRow({label,prev,now,delta}) { return <div className="compare-row"><span>{label}</span><span>{prev}</span><strong>{now}</strong><span>{delta}</span></div> }

export default App
