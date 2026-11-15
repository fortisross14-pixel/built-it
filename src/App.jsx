import React, { useEffect, useRef, useState } from 'react'
import Editor from './ui/Editor.jsx'
import { CareerEnd, Home, Hub, Legacy, NewCareer, Review, Shop, Unlocks, WorkModal } from './ui/screens.jsx'
import { feedback } from './ui/fx.js'
import { makeCtx } from './game/packs.js'
import { snapshot } from './ui/scene.js'
import { abandonCareer, acceptOffer, acknowledge, archiveCareer, buyPack, completeCommission, legacyTitle, newCareer, newMeta, perks, retireEarly, retryCommission } from './engine/career.js'
import { critique, evaluate } from './engine/score.js'
import { newProject } from './engine/plan.js'

const KEY = 'built-save-v2'

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    if (raw?.meta?.version === 2) return raw
  } catch { /* fresh save */ }
  return { meta: newMeta(), career: null }
}

function persist(save) {
  let data = save
  for (let attempt = 0; attempt < 4; attempt++) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return } catch {
      // Out of space: drop thumbnails from the oldest legacy entries first.
      const legacy = data.meta.legacy.map((l, i) => i >= data.meta.legacy.length - (attempt + 1) * 4 ? { ...l, works: l.works.map(w => ({ ...w, thumb: null })), best: null } : l)
      data = { ...data, meta: { ...data.meta, legacy } }
    }
  }
}

export default function App() {
  const [save, setSave] = useState(load)
  const { meta, career } = save
  const [screen, setScreenState] = useState(() => (save.career ? (save.career.pending ? 'review' : save.career.status !== 'active' ? 'end' : 'hub') : 'home'))
  const screenRef = useRef(screen)
  screenRef.current = screen
  // Screens form a stack in browser history, so the phone's back gesture steps back a screen
  // instead of leaving the game (game-ui-ux: screen stack).
  const setScreen = (next) => {
    if (next === screenRef.current) return
    setScreenState(next)
    try { window.history.pushState({ screen: next }, '') } catch { /* sandboxed */ }
  }
  useEffect(() => {
    // Seed history so a restored session (opened straight into the studio) still backs out to Home.
    try {
      window.history.replaceState({ screen: 'home' }, '')
      if (screenRef.current !== 'home') window.history.pushState({ screen: screenRef.current }, '')
    } catch { /* sandboxed */ }
    const onPop = () => {
      const cur = screenRef.current
      const parent = { editor: 'hub', hub: 'home', new: 'home', unlocks: 'home', legacy: 'home', shop: 'hub' }[cur]
      if (!parent) { try { window.history.pushState({ screen: cur }, '') } catch { /* sandboxed */ } return }
      setScreenState(parent)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const [work, setWork] = useState(null)

  useEffect(() => { persist(save) }, [save])
  const update = (patch) => setSave(s => ({ ...s, ...patch }))

  const startCareer = ({ name, profile }) => {
    let m = meta
    if (career) m = archiveCareer(m, career.status === 'active' ? retireEarly(career) : career)
    update({ meta: m, career: newCareer(m, { name, profile }) })
    setScreen('hub')
  }

  const accept = (offerId) => {
    const offer = career.offers.find(o => o.id === offerId)
    update({ career: acceptOffer(career, offerId, newProject(offer)) })
    setScreen('editor')
  }

  const saveProject = (project) => setSave(s => s.career?.current ? { ...s, career: { ...s.career, current: { ...s.career.current, project } } } : s)

  const submit = (project) => {
    const { offer } = career.current
    const result = evaluate(project, offer, perks(career))
    const thumb = snapshot(project, 360, 225)
    const c = { ...career, current: { ...career.current, project } }
    const res = completeCommission(meta, c, result, thumb)
    const crit = critique(result, offer)
    const next = { ...res.career, pending: { ...res.career.pending, review: crit } }
    if (res.entry.grade !== 'F') next.portfolio = next.portfolio.map((p, i) => i === next.portfolio.length - 1 ? { ...p, review: crit } : p)
    update({ meta: res.meta, career: next })
    setScreen('review')
    window.scrollTo(0, 0)
  }

  const afterReview = (c) => { update({ career: c }); setScreen(c.status === 'active' ? (c.current ? 'editor' : 'hub') : 'end'); window.scrollTo(0, 0) }

  const archive = () => {
    update({ meta: archiveCareer(meta, career), career: null })
    setScreen('legacy')
  }

  const ctx = makeCtx(meta, career)

  if (screen === 'editor' && career?.current) {
    return <Editor key={career.current.offer.id + (career.current.attempts || 0)} offer={career.current.offer} kit={perks(career)} ctx={ctx} project={career.current.project}
      onChange={saveProject} onSubmit={submit} onExit={() => setScreen('hub')} />
  }
  if (screen === 'review' && career?.pending) {
    return <Review entry={career.pending} career={career}
      onContinue={() => afterReview(acknowledge(career))}
      onRetry={() => afterReview(retryCommission(career))}
      onAbandon={() => afterReview(career.status === 'fired' ? acknowledge(career) : abandonCareer(career))} />
  }
  if (screen === 'end' && career) return <CareerEnd career={career} meta={meta} title={legacyTitle(career)} onArchive={archive} />
  if (screen === 'new') return <NewCareer meta={meta} warnReplace={!!career} onStart={startCareer} onBack={() => setScreen('home')} />
  if (screen === 'unlocks') return <Unlocks meta={meta} onBack={() => setScreen(career ? 'hub' : 'home')} />
  if (screen === 'legacy') return <Legacy meta={meta} onBack={() => setScreen('home')} />
  if (screen === 'shop' && career) {
    return <Shop career={career} onBack={() => setScreen('hub')} onBuy={(id) => { const r = buyPack(career, id); if (!r.error) { feedback('fanfare'); update({ career: r.career }) } }} />
  }
  if (screen === 'hub' && career) {
    return (
      <>
        <Hub career={career} meta={meta} onAccept={accept} onResume={() => setScreen('editor')} onHome={() => setScreen('home')}
          onShop={() => setScreen('shop')} onUnlocks={() => setScreen('unlocks')}
          onRetire={() => { update({ career: retireEarly(career) }); setScreen('end') }} onOpenWork={setWork} />
        {work && <WorkModal work={work} onClose={() => setWork(null)} />}
      </>
    )
  }
  return <Home meta={meta} career={career}
    onContinue={() => setScreen(career?.pending ? 'review' : career?.status === 'active' ? 'hub' : 'end')}
    onNew={() => setScreen('new')} onUnlocks={() => setScreen('unlocks')} onLegacy={() => setScreen('legacy')} />
}
