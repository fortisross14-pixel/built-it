import React, { useEffect, useRef, useState } from 'react'
import Editor from './ui/Editor.jsx'
import { CareerEnd, Collection, Home, Hub, Legacy, NewCareer, Review, WorkModal } from './ui/screens.jsx'
import { snapshot } from './ui/scene.js'
import { acceptOffer, archiveCareer, claimReward, completeCommission, legacyTitle, newCareer, newMeta, retireEarly } from './engine/career.js'
import { critique, evaluate } from './engine/score.js'
import { newProject } from './engine/plan.js'

const KEY = 'built-save-v1'

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    if (raw?.meta) return raw
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
  const [screen, setScreenState] = useState(() => (save.career ? (save.career.reward ? 'review' : save.career.status !== 'active' ? 'end' : 'hub') : 'home'))
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
      const parent = { editor: 'hub', hub: 'home', new: 'home', collection: 'home', legacy: 'home' }[cur]
      if (!parent) { try { window.history.pushState({ screen: cur }, '') } catch { /* sandboxed */ } return }
      setScreenState(parent)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const [work, setWork] = useState(null)

  useEffect(() => { persist(save) }, [save])
  const update = (patch) => setSave(s => ({ ...s, ...patch }))

  const startCareer = ({ name, kit }) => {
    let m = meta
    if (career) m = archiveCareer(m, career.status === 'active' ? retireEarly(career) : career)
    update({ meta: m, career: newCareer(m, { name, kit }) })
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
    const result = evaluate(project, offer, career.kit)
    const thumb = snapshot(project, 360, 225)
    const c = { ...career, current: { ...career.current, project } }
    const { career: next } = completeCommission(meta, c, result, thumb)
    const crit = critique(result, offer)
    const last = next.portfolio.length - 1
    next.portfolio = next.portfolio.map((p, i) => i === last ? { ...p, review: crit } : p)
    update({ career: next })
    setScreen('review')
    window.scrollTo(0, 0)
  }

  const pickReward = (cardId) => {
    const res = claimReward(meta, career, cardId)
    update({ meta: res.meta, career: res.career })
    setScreen(res.career.status === 'active' ? 'hub' : 'end')
    window.scrollTo(0, 0)
  }

  const archive = () => {
    update({ meta: archiveCareer(meta, career), career: null })
    setScreen('legacy')
  }

  if (screen === 'editor' && career?.current) {
    return <Editor key={career.current.offer.id} offer={career.current.offer} kit={career.kit} project={career.current.project}
      onChange={saveProject} onSubmit={submit} onExit={() => setScreen('hub')} />
  }
  if (screen === 'review' && career?.portfolio.length) {
    const entry = career.portfolio.at(-1)
    return <Review entry={entry} review={entry.review} reward={career.reward} onPick={pickReward} />
  }
  if (screen === 'end' && career) return <CareerEnd career={career} title={legacyTitle(career)} onArchive={archive} />
  if (screen === 'new') return <NewCareer meta={meta} warnReplace={!!career} onStart={startCareer} onBack={() => setScreen('home')} />
  if (screen === 'collection') return <Collection meta={meta} onBack={() => setScreen(career ? 'hub' : 'home')} />
  if (screen === 'legacy') return <Legacy meta={meta} onBack={() => setScreen('home')} />
  if (screen === 'hub' && career) {
    return (
      <>
        <Hub career={career} onAccept={accept} onResume={() => setScreen('editor')} onHome={() => setScreen('home')}
          onRetire={() => { update({ career: retireEarly(career) }); setScreen('end') }} onOpenWork={setWork} />
        {work && <WorkModal work={work} onClose={() => setWork(null)} />}
      </>
    )
  }
  return <Home meta={meta} career={career}
    onContinue={() => setScreen(career?.status === 'active' ? 'hub' : 'end')}
    onNew={() => setScreen('new')} onCollection={() => setScreen('collection')} onLegacy={() => setScreen('legacy')} />
}
