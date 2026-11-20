import React, { useEffect, useMemo, useRef, useState } from 'react'
import Editor from './ui/Editor.jsx'
import { CareerEnd, Home, Hub, Legacy, NewCareer, Review, Shop, Unlocks, WorkModal } from './ui/screens.jsx'
import { feedback } from './ui/fx.js'
import { makeCtx } from './game/packs.js'
import { snapshot } from './ui/scene.js'
import { abandonCareer, acceptOffer, acknowledge, archiveCareer, buyPack, completeCommission, legacyTitle, newCareer, newMeta, perks, retireEarly, retryCommission } from './engine/career.js'
import { critique, evaluate } from './engine/score.js'
import { newProject } from './engine/plan.js'
import { KEY, exportSave, isNewer, parseImport, readStored, requestPersistence, stampOf, writeSave } from './save.js'
import SaveBanner from './ui/SaveBanner.jsx'

function initialSave() {
  const r = readStored()
  return { save: r.save || { meta: newMeta(), career: null }, error: r.error || null }
}

export default function App() {
  const [boot] = useState(initialSave)
  const [save, setSave] = useState(boot.save)
  const { meta, career } = save
  const [saveStatus, setSaveStatus] = useState(boot.error ? { kind: 'error', text: boot.error } : null)
  const [syncKey, setSyncKey] = useState(0) // remounts the editor when a newer save is loaded
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

  // ---- saving (see save.js). Writes are batched (a burst of edits = one write) and flushed when the
  // app is hidden or closed. Before writing, and whenever the app comes back to the front, it checks
  // whether another copy (a second tab, the installed app) saved something newer, and loads that
  // instead of overwriting it.
  const saveRef = useRef(save)
  saveRef.current = save
  const base = useRef(stampOf(boot.save))
  const dirty = useRef(false)
  const adopting = useRef(false)
  const adopt = (stored, why) => {
    base.current = stampOf(stored)
    saveRef.current = stored
    dirty.current = false
    adopting.current = true
    setSave(stored)
    setSyncKey(k => k + 1)
    if (stored.career?.pending) setScreenState('review')
    else if (!stored.career && ['editor', 'hub', 'shop'].includes(screenRef.current)) setScreenState('home')
    if (why) setSaveStatus({ kind: 'info', text: why })
  }
  const writeNow = () => {
    if (!dirty.current) return
    dirty.current = false
    const r = writeSave(saveRef.current, base.current)
    if (r.ok) {
      base.current = r.stamp
      setSaveStatus(st => r.shed ? { kind: 'warn', text: 'Storage was nearly full, so older thumbnails and plans were removed to keep saving. Download a backup in Settings to be safe.' }
        : st?.kind === 'error' ? { kind: 'ok', text: 'Saving works again.' } : st)
    } else if (r.conflict) {
      adopt(r.conflict, 'Built it! is open in another tab or window. Loaded the newest progress from there: keep playing in just one.')
    } else {
      dirty.current = true // try again on the next change
      setSaveStatus({ kind: 'error', text: r.error })
    }
  }
  const writeRef = useRef(writeNow)
  writeRef.current = writeNow
  const checkNewer = (why) => {
    const r = readStored()
    if (r.save && isNewer(stampOf(r.save), base.current) && !dirty.current) adopt(r.save, why)
  }
  const checkRef = useRef(checkNewer)
  checkRef.current = checkNewer
  useEffect(() => {
    if (adopting.current) { adopting.current = false; return }
    if (save === boot.save) return // nothing changed since loading
    dirty.current = true
    const t = setTimeout(() => writeRef.current(), 200)
    return () => clearTimeout(t)
  }, [save]) // eslint-disable-line
  useEffect(() => {
    requestPersistence()
    const flush = () => writeRef.current()
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); else checkRef.current('Loaded your latest progress from another tab or window.') }
    const onStorage = (e) => { if (e.key === KEY || e.key === null) checkRef.current('Updated with progress saved in another tab or window.') }
    const onFocus = () => checkRef.current('Loaded your latest progress from another tab or window.')
    window.addEventListener('pagehide', flush)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    // Backup download / restore, asked for from Settings.
    const onExport = () => {
      writeRef.current()
      const url = URL.createObjectURL(exportSave(saveRef.current))
      const a = document.createElement('a')
      a.href = url; a.download = `built-it-save-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    }
    const onImport = (e) => {
      try {
        const next = parseImport(e.detail)
        const w = writeSave(next, { savedAt: Date.now() + 1e9, rev: 1e9 }) // a restore always wins
        if (!w.ok) throw new Error(w.error || 'Could not write the backup.')
        base.current = w.stamp
        adopt({ ...next, ...w.stamp }, 'Backup restored.')
        setScreenState('home')
      } catch (err) { setSaveStatus({ kind: 'error', text: `Restore failed: ${err.message}` }) }
    }
    window.addEventListener('built:export', onExport)
    window.addEventListener('built:import', onImport)
    return () => {
      window.removeEventListener('pagehide', flush); window.removeEventListener('storage', onStorage); window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('built:export', onExport); window.removeEventListener('built:import', onImport)
      flush()
    }
  }, []) // eslint-disable-line
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

  const saveProject = (project) => {
    const s = saveRef.current
    if (!s.career?.current || s.career.current.project === project) return
    const next = { ...s, career: { ...s.career, current: { ...s.career.current, project } } }
    saveRef.current = next // visible to a flush in this same tick (e.g. the app being closed)
    setSave(next)
  }

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

  // Stable between edits, so the editor doesn't re-score on every save.
  const ctx = useMemo(() => makeCtx(meta, career), [meta.unlocked, career?.packs, career?.profile]) // eslint-disable-line
  const kit = useMemo(() => perks(career), [career?.packs, career?.profile]) // eslint-disable-line

  const view = (() => {
  if (screen === 'editor' && career?.current) {
      return <Editor key={career.current.offer.id + (career.current.attempts || 0) + ':' + syncKey} offer={career.current.offer} kit={kit} ctx={ctx} project={career.current.project}
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
  })()
  return (
    <>
      {view}
      <SaveBanner status={saveStatus} onClose={() => setSaveStatus(null)}
        onRetry={() => { dirty.current = true; writeRef.current() }} onBackup={() => window.dispatchEvent(new Event('built:export'))} />
    </>
  )
}
