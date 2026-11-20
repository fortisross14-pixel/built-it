import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { feedback, onSettings, setSetting, settings as fxSettings } from './fx.js'
import { canPrompt, isIOS, isStandalone, onInstallChange, promptInstall } from './install.js'
import { listHistory } from '../saveDb.js'
import Icon from './icons.jsx'
import View3D from './View3D.jsx'
import { ItemSymbol } from './PlanView.jsx'
import { BRIEFS, GRADES, LOT_KINDS, TWISTS, levelsFor, wishById } from '../game/briefs.js'
import { CEILINGS, INDUSTRIES, ITEMS, MATERIALS, PAINTS, ROOFS, ROOMS, STYLES } from '../game/catalog.js'
import { PACKS, packContents } from '../game/packs.js'
import { COMPLETE_AT, MAX_LEVEL, RANKS, feeFor, profilesEarned, randomArchitect, rankFor } from '../engine/career.js'
import { referenceCafe } from '../game/demo.js'
import { BACKGROUNDS, COUNTRIES, GENDERS, PROFILES, countryName, flag, profileById, profileUnlocked } from '../game/architects.js'
import Avatar from './Avatar.jsx'
import ProjectArt from './ProjectArt.jsx'
import { Diamond, Num, PerspectiveLines, Title, WaveMesh, Window } from './deco.jsx'
import PlanView from './PlanView.jsx'
import { money } from './format.js'

const GRADE_COLOR = { S: 'g-s', A: 'g-a', B: 'g-b', C: 'g-c', F: 'g-f' }

export function Stars({ n, size = 16, shown = null }) {
  return <span className={`stars ${shown !== null ? 'reveal' : ''}`} aria-label={`${n} stars`}>{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={size} fill={i <= n ? 'currentColor' : 'none'} className={`${i <= n ? 'on' : ''} ${shown === null || i <= shown ? 'shown' : ''}`} />)}</span>
}

export function GradeBadge({ g, big }) {
  return <span className={`grade ${GRADE_COLOR[g] || ''} ${big ? 'big' : ''}`}>{g}</span>
}

// Manual install steps when the browser doesn't offer its own install prompt.
function installHelp() {
  const ua = navigator.userAgent
  if (/FBAN|FBAV|Instagram|WhatsApp|Line\/|GSA\/|Snapchat|TikTok|LinkedInApp/i.test(ua))
    return <>You're in an app's built-in browser, which can't install apps. Open this page in <b>Safari</b> (iPhone) or <b>Chrome</b> (Android), then tap Install again.</>
  if (isIOS()) return /CriOS|FxiOS|EdgiOS/.test(ua)
    ? <>Tap the <b>Share</b> icon in the address bar, then <b>Add to Home Screen</b>. If you don't see it, open the page in Safari and use <b>Share → Add to Home Screen</b>.</>
    : <>Tap <b>Share</b> (the square with an arrow) in Safari's toolbar, scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.</>
  if (/SamsungBrowser/.test(ua)) return <>Tap the <b>menu (≡)</b>, then <b>Add page to → Home screen</b>.</>
  if (/Firefox/.test(ua)) return <>Tap the <b>menu (⋮)</b>, then <b>Install</b> or <b>Add to Home screen</b>.</>
  return <>Tap the browser <b>menu (⋮)</b>, then <b>Install app</b> or <b>Add to Home screen</b>. If it isn't there yet, reload the page once and try again.</>
}

function lastSaved() {
  try {
    const sv = JSON.parse(localStorage.getItem('built-save-v2') || 'null')
    if (!sv) return 'Nothing saved yet.'
    return sv.savedAt ? `Last saved ${new Date(sv.savedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}. Download a copy to keep it safe.` : 'Your progress is saved on this device. Download a copy to keep it safe.'
  } catch { return 'Storage is not available.' }
}

// ------------------------------------------------------------------ Settings
export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [s, setS] = useState(fxSettings)
  useEffect(() => onSettings(setS), [])
  const [, bump] = useState(0)
  useEffect(() => onInstallChange(() => bump(n => n + 1)), [])
  const [iosHelp, setIosHelp] = useState(false)
  const [versions, setVersions] = useState([])
  useEffect(() => { if (open) listHistory().then(setVersions).catch(() => setVersions([])) }, [open])
  const installed = isStandalone()
  const rows = [
    ['sound', 'Sound', 'Clicks, stamps and fanfares'],
    ['haptics', 'Haptics', 'Vibration on supported phones'],
    ['reduceMotion', 'Reduce motion', 'Calmer transitions, no camera glides'],
  ]
  return (
    <>
      <button className="icon-btn" onClick={() => { feedback('tap'); setOpen(true) }} aria-label="Settings"><Icon name="gear" /></button>
      {open && createPortal(
        <div className="modal-wrap" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Settings">
            <h3>Settings</h3>
            <div className="settings-list">
              {rows.map(([k, label, hint]) => (
                <button key={k} className="toggle-row" role="switch" aria-checked={!!s[k]} onClick={() => { setSetting(k, !s[k]); feedback('select') }}>
                  <span><b>{label}</b><small>{hint}</small></span><i className={`switch ${s[k] ? 'on' : ''}`} />
                </button>
              ))}
            </div>
            {!installed && (
              <div className="install-row">
                <span><b>Install Built it!</b><small>Play fullscreen from your home screen, even offline.</small></span>
                <button className="ghost small" onClick={async () => { feedback('select'); if (canPrompt()) await promptInstall(); else setIosHelp(h => !h) }}><Icon name="plus" size={16} />Install</button>
                {iosHelp && <p className="dim small ios-help">{installHelp()}</p>}
              </div>
            )}
            {installed && <p className="dim small">Installed as an app. Your progress is saved on this device.</p>}
            <div className="install-row backup-row">
              <span><b>Backup</b><small>{lastSaved()}</small></span>
              <div className="row wrap">
                <button className="ghost small" onClick={() => { feedback('select'); window.dispatchEvent(new Event('built:export')) }}><Icon name="brief" size={16} />Download</button>
                <label className="ghost small file-btn"><Icon name="plus" size={16} />Restore
                  <input type="file" accept="application/json,.json" onChange={async (e) => {
                    const f = e.target.files?.[0]; e.target.value = ''
                    if (!f) return
                    if (!window.confirm('Restore this backup? It replaces the progress on this device.')) return
                    window.dispatchEvent(new CustomEvent('built:import', { detail: await f.text() }))
                    setOpen(false)
                  }} />
                </label>
              </div>
              {versions.length > 0 && (
                <details className="versions">
                  <summary>Earlier versions ({versions.length})</summary>
                  <ul>{versions.slice(0, 12).map(v => (
                    <li key={v.savedAt}>
                      <span><b>{new Date(v.savedAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</b><small>{v.label}</small></span>
                      <button className="ghost small" onClick={() => { if (window.confirm('Go back to this version? Your current progress is replaced (it stays in this list).')) { window.dispatchEvent(new CustomEvent('built:restore-version', { detail: v.savedAt })); setOpen(false) } }}>Restore</button>
                    </li>
                  ))}</ul>
                </details>
              )}
              <p className="dim small">Each copy of the game keeps its own save: an installed app and the browser on iPhone don't share progress. Use a backup to move between them.</p>
            </div>
            <div className="row end"><button className="primary" onClick={() => setOpen(false)} autoFocus>Done</button></div>
          </div>
        </div>, document.body
      )}
    </>
  )
}

function Brand({ small }) {
  return <div className={`brand ${small ? 'small' : ''}`}><span className="brand-mark" aria-hidden="true"><i /><i /></span><span className="brand-word"><b>BUILT IT!</b><em>architecture</em></span></div>
}

const unlockables = () => [...Object.entries(ITEMS), ...Object.entries(MATERIALS)].filter(([, d]) => d.unlock)

// ------------------------------------------------------------------ Home
export function Home({ meta, career, onContinue, onNew, onUnlocks, onLegacy }) {
  const demo = useMemo(() => {
    const last = career?.portfolio?.at(-1)?.project || meta.legacy[0]?.best?.project
    return last || referenceCafe()
  }, [career, meta])
  const total = unlockables().length
  const items = []
  if (career && career.status === 'active') items.push({ t: 'Continue', d: `${career.name} · Level ${career.level} · ${money(career.cash, true)}`, on: onContinue, main: true })
  if (career && career.status !== 'active') items.push({ t: 'Close out the career', d: career.name, on: onContinue, main: true })
  items.push({ t: career ? 'New architect' : 'Open your studio', d: career ? 'End this career and start another' : 'Start with a corner shop', on: onNew, main: !career })
  items.push({ t: 'Unlocks', d: `${meta.unlocked.length} of ${total} pieces, shared by every architect`, on: onUnlocks })
  items.push({ t: 'Legacy hall', d: meta.legacy.length ? `${meta.legacy.length} finished career${meta.legacy.length > 1 ? 's' : ''}` : 'No plaques yet', on: onLegacy })
  return (
    <div className="home">
      <WaveMesh className="tl" />
      <div className="home-model"><View3D project={demo} autoRotate interactive={false} className="hero-3d" zoom={1.35} look="model" /></div>
      <header className="home-top"><Brand /><SettingsButton /></header>
      <div className="home-card">
        <span className="eyebrow">An architecture career game</span>
        <Title light="Your" bold="Architecture" after="Office" />
        <p className="lead">Start with a corner shop. Grade well and the work grows into restaurants, museums, arenas and an airport.</p>
        <nav className="menu-list" aria-label="Main menu">
          {items.map((it, i) => (
            <button key={it.t} className={`menu-item ${it.main ? 'main' : ''}`} onClick={() => { feedback('select'); it.on() }} style={{ animationDelay: `${0.25 + i * 0.07}s` }}>
              <span className="mi-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="mi-t"><b>{it.t}</b><em>{it.d}</em></span>
              <Icon name="chevron" size={18} className="mi-go" />
            </button>
          ))}
        </nav>
      </div>
      <footer className="home-foot"><span>Commission</span><i /><span>Design</span><i /><span>Grade</span><i /><span>Unlock</span><i /><span>Climb</span></footer>
    </div>
  )
}

// ------------------------------------------------------------------ New career
function sigLabels(prof) {
  if (prof.base) return [PAINTS.paper.label, ITEMS.paperLantern.label]
  const g = prof.sig
  return [PAINTS[g.wall]?.label, MATERIALS[g.floor]?.label, CEILINGS[g.ceiling]?.label, ROOFS[g.roof]?.label].filter(Boolean)
}
function sigColors(prof) {
  if (prof.base) return [PAINTS.paper.color, '#f3e9d2']
  const g = prof.sig
  return [PAINTS[g.wall]?.color, MATERIALS[g.floor]?.color, CEILINGS[g.ceiling]?.color, ROOFS[g.roof]?.color].filter(Boolean)
}

export function NewCareer({ meta, onStart, onBack, warnReplace }) {
  const [pid, setPid] = useState(PROFILES[0].id)
  const prof = profileById(pid)
  const [name, setName] = useState(prof.name)
  const [age, setAge] = useState(prof.age)
  const [gender, setGender] = useState(prof.gender)
  const [country, setCountry] = useState(prof.country)
  const choose = (p) => {
    if (!profileUnlocked(meta, p)) { feedback('error'); return }
    feedback('select'); setPid(p.id); setName(p.name); setAge(p.age); setGender(p.gender); setCountry(p.country)
  }
  const bg = BACKGROUNDS[prof.background]
  const founderName = (id) => profileById(id)?.name.split(' ')[0]
  return (
    <div className="page">
      <header className="page-top"><button className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="back" /></button><Brand small /><span /></header>
      <div className="page-body narrow">
        <WaveMesh className="tr" />
        <span className="eyebrow">Architect no. {String(meta.careers + 1).padStart(2, '0')}</span>
        <Title as="h2" light="Who's opening" bold="the studio?" />
        {warnReplace && <p className="warn">Your current architect's career will end and go to the legacy hall.</p>}
        <div className="prof-grid" role="listbox" aria-label="Architect profiles">
          {PROFILES.map((p, i) => {
            const open = profileUnlocked(meta, p)
            return (
              <button key={p.id} role="option" aria-selected={pid === p.id} className={`prof-card ${pid === p.id ? 'on' : ''} ${open ? '' : 'locked'}`} onClick={() => choose(p)}>
                <span className="pc-img"><img src={`${import.meta.env.BASE_URL}art/architects/${p.avatar}.jpg`} alt="" loading="lazy" />{!open && <span className="pc-lock"><Icon name="lock" size={18} /></span>}</span>
                <span className="pc-num mono">{String(i + 1).padStart(2, '0')}</span>
                <b>{p.title}</b>
                <span className="pc-meta">{p.base ? 'No bonus · founders kit' : `${BACKGROUNDS[p.background].label.replace('Architect + ', '').replace(/^./, c => c.toUpperCase())} · ${p.expertise.map(x => INDUSTRIES[x].label).join(', ')}`}</span>
                {!open && <span className="pc-unlock">Complete a career with {founderName(p.unlockBy)}</span>}
              </button>
            )
          })}
        </div>
        <div className="profile-card">
          <Avatar name={name} profile={{ avatar: prof.avatar, country }} size={96} className="big" />
          <div className="profile-fields">
            <div className="prof-perks">
              <span className="mono dim">{prof.title.toUpperCase()}</span>
              <p><b>{bg.label}.</b> {bg.text}</p>
              {prof.expertise.length > 0 && <p><b>Expertise: {prof.expertise.map(x => INDUSTRIES[x].label).join(', ')}.</b> +5 Functionality and +10% fees on those projects.</p>}
              <div className="sig-row">
                <span className="mono dim">{prof.base ? 'FOUNDERS KIT' : 'SIGNATURE FINISHES'}</span>
                <div className="sig-chips">{sigLabels(prof).map((l, i) => <span key={l} className="tag-chip"><i style={{ background: sigColors(prof)[i] }} />{l}</span>)}</div>
              </div>
            </div>
            <label className="field">
              <span className="mono dim">NAME</span>
              <div className="row">
                <input value={name} onChange={e => setName(e.target.value)} maxLength={28} />
                <button className="icon-btn" onClick={() => { feedback('tap'); setName(randomArchitect(Date.now() + Math.random() * 1e6)) }} aria-label="Random name"><Icon name="dice" /></button>
              </div>
            </label>
            <div className="field-row">
              <label className="field">
                <span className="mono dim">AGE</span>
                <div className="stepper">
                  <button onClick={() => setAge(a => Math.max(22, a - 1))} aria-label="Younger">−</button>
                  <b className="mono">{age}</b>
                  <button onClick={() => setAge(a => Math.min(75, a + 1))} aria-label="Older">+</button>
                </div>
              </label>
              <label className="field grow">
                <span className="mono dim">COUNTRY</span>
                <select value={country} onChange={e => setCountry(e.target.value)} className="select">
                  <option value="">Choose…</option>
                  {COUNTRIES.map(([code, n]) => <option key={code} value={code}>{flag(code)} {n}</option>)}
                </select>
              </label>
            </div>
            <div className="field">
              <span className="mono dim">GENDER</span>
              <div className="chips wrap">{GENDERS.map(g => <button key={g} className={`chip ${gender === g ? 'on' : ''}`} onClick={() => setGender(g)}>{g}</button>)}</div>
            </div>
          </div>
        </div>
        <div className="info-grid">
          <div><Icon name="flag" /><b>Start at level 1</b><span>Your first client is one of three basics: a boutique, a fast-food counter or a corner grocery.</span></div>
          <div><Icon name="lock" /><b>{meta.unlocked.length} permanent unlocks</b><span>Everything earlier architects unlocked with B, A and S grades is yours from day one.</span></div>
          <div><Icon name="star" /><b>{PROFILES.filter(p => profileUnlocked(meta, p)).length}/10 architects</b><span>Finish a career (5+ approved commissions) with a founder to open four specialists.</span></div>
        </div>
        <div className="sticky-cta">
          <button className="primary big" disabled={!name.trim()} onClick={() => onStart({ name: name.trim(), profile: { age, gender, country, background: prof.background, avatar: prof.avatar, profileId: prof.id } })}><Icon name="building" size={18} />Open studio</button>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Hub
function Ladder({ career }) {
  const byLevel = {}
  career.portfolio.forEach(p => { (byLevel[p.offer.level] ||= []).push(p) })
  const pct = (career.level - 1) / (MAX_LEVEL - 1) * 100
  return (
    <div className="ladder-scale" aria-label={`Level ${career.level} of ${MAX_LEVEL}`}>
      <div className="ls-line"><i style={{ width: `${pct}%` }} /></div>
      {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(l => (
        <div key={l} className={`ls-tick ${l === career.level ? 'now' : ''} ${l < career.level ? 'past' : ''}`} style={{ left: `${(l - 1) / (MAX_LEVEL - 1) * 100}%` }}>
          <span className="ls-grades">{(byLevel[l] || []).map((p, i) => <GradeBadge key={i} g={p.grade} />)}</span>
          <b>{String(l).padStart(2, '0')}</b>
          {l === career.level && <em>you</em>}
        </div>
      ))}
    </div>
  )
}

export function Hub({ career, meta, onAccept, onResume, onHome, onRetire, onOpenWork, onShop, onUnlocks }) {
  const [confirmRetire, setConfirmRetire] = useState(false)
  const [openOffer, setOpenOffer] = useState(null)
  const rank = rankFor(career.rep)
  const nextRank = RANKS.find(r => r.rep > career.rep)
  const slots = Array.from({ length: career.maxCommissions }, (_, i) => career.portfolio[i] || null)
  const prof = career.profile || {}
  return (
    <div className="page hub">
      <header className="page-top">
        <button className="icon-btn" onClick={onHome} aria-label="Home"><Icon name="back" /></button>
        <Brand small />
        <div className="row"><SettingsButton /><button className="ghost small" onClick={() => setConfirmRetire(true)}><Icon name="flag" size={16} /><span className="hide-xs">Retire</span></button></div>
      </header>
      <div className="page-body">
        <section className="studio-head">
          <WaveMesh className="tr" />
          <div className="studio-id">
            <Avatar name={career.name} profile={prof} size={92} />
            <div>
              <span className="eyebrow">Studio of</span>
              <h1 className="display-xl">{career.name}</h1>
            </div>
          </div>
          <p className="studio-meta">
            {prof.country && <span>{flag(prof.country)} {countryName(prof.country)}</span>}
            {prof.age && <span>{prof.age}</span>}
            {profileById(prof.profileId) ? <span>{profileById(prof.profileId).title}</span> : prof.background && <span>{BACKGROUNDS[prof.background]?.label}</span>}
            <span className="rank">{rank.title}</span>
          </p>
        </section>

        <section className="kpis">
          <div><span className="eyebrow">Level</span><b className="display-num">{String(career.level).padStart(2, '0')}<small>/{MAX_LEVEL}</small></b></div>
          <div><span className="eyebrow">Cash</span><b className="display-num">{money(career.cash, true)}</b><button className="link-btn" onClick={onShop}>Supplier catalogue<Icon name="chevron" size={14} /></button></div>
          <div><span className="eyebrow">Reputation</span><b className="display-num">{career.rep}</b>{nextRank && <em className="dim small">{nextRank.rep - career.rep} to {nextRank.title}</em>}</div>
          <div><span className="eyebrow">Strikes</span><div className="strike-dots">{Array.from({ length: career.maxStrikes }, (_, i) => <i key={i} className={i < career.strikes ? 'hit' : ''} />)}</div><em className="dim small">an F is a strike</em></div>
        </section>

        <section className="card-float ladder-card">
          <div className="sec-head"><Title as="h3" light="Difficulty" bold="ladder" /><span className="eyebrow">S +2 · A +1 · B +1 · C −1</span></div>
          <Ladder career={career} />
        </section>

        {career.current ? (
          <section className="card-float resume">
            <ProjectArt briefId={career.current.offer.briefId} size={84} />
            <div className="grow">
              <span className="eyebrow">On the drawing board{career.current.attempts ? ` · attempt ${career.current.attempts + 1}` : ''}</span>
              <h3>{BRIEFS[career.current.offer.briefId].name}</h3>
              <p className="dim">{career.current.offer.client}</p>
            </div>
            <button className="primary big" onClick={onResume}><Icon name="play" size={18} />Continue designing</button>
          </section>
        ) : (
          <section className="board">
            <div className="board-text">
              <span className="eyebrow">Level {String(career.level).padStart(2, '0')}</span>
              <Title as="h2" light="Commission" bold="board" />
              <p className="dim">{career.offers.filter(o => !o.locked).length} clients would like to meet you. Open a project to read the brief.</p>
              <ol className="board-list">
                {career.offers.map((o, i) => {
                  const b = BRIEFS[o.briefId]
                  const [tagLabel, tagClass] = TAGS[o.tag] || TAGS.match
                  return (
                    <li key={o.id} style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
                      <button className={`bl-item ${o.locked ? 'locked' : ''}`} onClick={() => { feedback('tap'); setOpenOffer(o) }}>
                        <Num n={i + 1} />
                        <span className="bl-t"><b>{b.name}</b><em>LV {o.level} · {money(o.budget, true)} · <span className={`offer-tag ${tagClass}`}>{tagLabel}</span></em></span>
                        <Icon name={o.locked ? 'lock' : 'chevron'} size={16} className="mi-go" />
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
            <div className={`diamonds n${career.offers.length}`}>
              {career.offers.map((o, i) => (
                <Diamond key={o.id} n={i + 1} locked={o.locked} onClick={() => { feedback('tap'); setOpenOffer(o) }} style={{ animationDelay: `${0.15 + i * 0.09}s` }}>
                  <ProjectArt briefId={o.briefId} size={240} className="fill" />
                </Diamond>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="sec-head"><Title as="h3" light="Selected" bold="works" /><span className="eyebrow">{career.portfolio.length} of {career.maxCommissions}</span></div>
          <div className="works-grid">
            {slots.filter((p, i) => p || i === career.portfolio.length).map((p, i) => (
              <button key={i} className={`work-slot ${p ? 'done' : i === career.portfolio.length ? 'next' : ''}`} onClick={() => p && onOpenWork(p)} disabled={!p}>
                <span className="ws-img">{p?.thumb ? <img src={p.thumb} alt="" /> : <PerspectiveLines className="mini" />}</span>
                <span className="ws-cap"><em>{String(i + 1).padStart(2, '0')}</em>{p ? <><b>{BRIEFS[p.briefId].name}</b><GradeBadge g={p.grade} /></> : <b className="dim">{i === career.portfolio.length ? 'Next commission' : '—'}</b>}</span>
              </button>
            ))}
          </div>
          {career.maxCommissions - career.portfolio.length > 1 && <p className="dim small works-left">{career.maxCommissions - career.portfolio.length - 1} more commissions after this one, then retirement.</p>}
          <div className="row wrap hub-links">
            <button className="link-btn" onClick={onUnlocks}><Icon name="lock" size={14} />Permanent unlocks · {meta.unlocked.length}<Icon name="chevron" size={14} /></button>
            <span className="dim small">Supplies: {career.packs.length ? career.packs.map(id => PACKS[id].name).join(', ') : 'none yet'}</span>
          </div>
        </section>
      </div>
      {openOffer && <OfferSheet offer={openOffer} meta={meta} onClose={() => setOpenOffer(null)} onAccept={() => { setOpenOffer(null); onAccept(openOffer.id) }} />}
      {confirmRetire && (
        <Window onClose={() => setConfirmRetire(false)} variant="dialog" label="Retire">
          {(close) => (<>
            <Title as="h3" light="Retire" bold={career.name} after="?" />
            <p className="dim">The career ends now and the portfolio goes to the legacy hall. Permanent unlocks stay for every architect; supplier packs and cash do not.</p>
            <div className="row end"><button className="ghost" onClick={close}>Not yet</button><button className="primary" onClick={onRetire}>Retire</button></div>
          </>)}
        </Window>
      )}
    </div>
  )
}

const TAGS = { match: ['At your level', ''], safe: ['Safer job', 'safe'], stretch: ['Stretch', 'stretch'], basic: ['First job', ''], teaser: ['Score S to reach', 'teaser'] }

function OfferSheet({ offer, meta, onClose, onAccept }) {
  const b = BRIEFS[offer.briefId]
  const lvs = levelsFor(offer)
  const tw = offer.twist ? TWISTS[offer.twist] : null
  const [tagLabel, tagClass] = TAGS[offer.tag] || TAGS.match
  const best = meta.best?.[offer.briefId]
  const words = b.name.split(' ')
  return (
    <Window onClose={onClose} label={b.name} className="offer-win">
      {(close) => (<>
        <div className="ow-hero">
          <Diamond><ProjectArt briefId={offer.briefId} size={240} className="fill" /></Diamond>
          <div className="ow-head">
            <span className="eyebrow">Level {String(offer.level).padStart(2, '0')} · {INDUSTRIES[b.industry].label}</span>
            <Title as="h2" light={words.slice(0, -1).join(' ')} bold={words.at(-1)} />
            <p className="client">{offer.client}</p>
            <span className="row wrap"><span className={`offer-tag ${tagClass}`}>{tagLabel}</span>{offer.styles.map(st => <span key={st} className="tag-chip">{STYLES[st]}</span>)}{best && <span className="dim small">best <GradeBadge g={best} /></span>}</span>
          </div>
        </div>
        <div className="ow-body">
          <p className="blurb">{b.blurb}</p>
          <div className="ow-facts">
            <div><Num n={1} /><span className="eyebrow">Budget</span><b className="display-num">{money(offer.budget, true)}</b></div>
            <div><Num n={2} /><span className="eyebrow">Fee at S</span><b className="display-num">{money(Math.round(feeFor(offer.level) * 1.6 * (tw?.fee || 1)), true)}</b></div>
            <div><Num n={3} /><span className="eyebrow">Lot</span><b className="display-num">{offer.lot.w}×{offer.lot.h}</b></div>
            <div><Num n={4} /><span className="eyebrow">Floors</span><b className="display-num">{lvs.min === lvs.max ? lvs.min : `${lvs.min}–${lvs.max}`}</b></div>
          </div>
          {tw && <div className="twist"><b>{tw.name}</b><span>{tw.text}</span></div>}
          {offer.lot.kind && offer.lot.kind !== 'standard' && <div className="twist site"><b>{LOT_KINDS[offer.lot.kind].label}</b><span>{LOT_KINDS[offer.lot.kind].text}</span></div>}
          {(offer.wishes || []).length > 0 && (
            <div className="os-program wishes">
              <span className="eyebrow">Client wishes</span>
              <ul>{offer.wishes.map(wishById).filter(Boolean).map(w => <li key={w.id}>{w.label}</li>)}</ul>
            </div>
          )}
          <div className="os-program">
            <span className="eyebrow">Program</span>
            <ul>{b.rooms.map((r, i) => <li key={i}>{r.count > 1 ? `${r.count}× ` : ''}{ROOMS[r.type].label} <em>≥ {r.min} m²</em></li>)}</ul>
            <span className="dim small">{b.items.reduce((n, it) => n + (it.count || 1), 0)} required pieces of furniture and equipment{b.needsLift && lvs.max > 1 ? ' · lift required' : ''}</span>
          </div>
        </div>
        <div className="ow-foot">
          {offer.locked
            ? <span className="locked-note"><Icon name="lock" size={16} />Score S on your next project to reach this level</span>
            : <><button className="ghost" onClick={close}>Not now</button><button className="primary big" onClick={() => { feedback('stamp'); onAccept() }}><Icon name="stamp" size={18} />Accept project</button></>}
        </div>
      </>)}
    </Window>
  )
}

// ------------------------------------------------------------------ Shop
export function Shop({ career, onBuy, onBack }) {
  const kinds = [...new Set(Object.values(PACKS).map(p => p.kind))]
  return (
    <div className="page">
      <header className="page-top"><button className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="back" /></button><Brand small /><span className="cash-pill mono">{money(career.cash)}</span></header>
      <div className="page-body">
        <div>
          <Title as="h2" light="Supplier" bold="catalogue" />
          <p className="dim">Packs unlock finishes, decor, lighting and studio services for <b>{career.name}</b> only. Fees from every passed project top up your cash.</p>
        </div>
        {kinds.map(k => (
          <section key={k}>
            <h3>{k}</h3>
            <div className="packs">
              {Object.entries(PACKS).filter(([, p]) => p.kind === k).map(([id, p]) => {
                const owned = career.packs.includes(id)
                const short = career.cash < p.price
                const contents = packContents(id)
                return (
                  <article key={id} className={`pack ${owned ? 'owned' : ''}`}>
                    <span className="pack-img"><img src={`${import.meta.env.BASE_URL}art/packs/${id}.jpg`} alt="" loading="lazy" onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }} /></span>
                    <div className="pack-head"><b>{p.name}</b><span className="mono">{money(p.price, true)}</span></div>
                    <p className="dim small">{p.text}</p>
                    {contents.length > 0 && <p className="pack-list mono">{contents.join(' · ')}</p>}
                    {owned ? <span className="owned-tag"><Icon name="check" size={14} stroke={2.6} />Owned</span>
                      : <button className="primary small-btn" disabled={short} onClick={() => onBuy(id)}>{short ? `Need ${money(p.price - career.cash, true)} more` : 'Buy'}</button>}
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Unlocks
export function Unlocks({ meta, onBack }) {
  const all = unlockables()
  const order = { B: 0, A: 1, S: 2 }
  return (
    <div className="page">
      <header className="page-top"><button className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="back" /></button><Brand small /><span className="mono dim">{meta.unlocked.length}/{all.length}</span></header>
      <div className="page-body">
        <div>
          <Title as="h2" light="Permanent" bold="unlocks" />
          <p className="dim">Grades unlock pieces for that industry, for every architect from now on. <b>C</b> passes, <b>B</b> unlocks the basics, <b>A</b> the advanced pieces, <b>S</b> the special category.</p>
        </div>
        {Object.entries(INDUSTRIES).map(([ind, info]) => {
          const list = all.filter(([, d]) => d.ind?.[0] === ind).sort((a, b) => order[a[1].unlock] - order[b[1].unlock])
          if (!list.length) return null
          const briefs = Object.entries(BRIEFS).filter(([, b]) => b.industry === ind)
          return (
            <section key={ind} className="unlock-ind">
              <div className="sec-head"><h3><Icon name={info.icon} size={18} /> {info.label}</h3>
                <span className="row">{briefs.map(([id, b]) => <span key={id} className="mono dim small" title={b.name}>L{b.level}{meta.best?.[id] ? <GradeBadge g={meta.best[id]} /> : '·'}</span>)}</span>
              </div>
              <div className="cat-grid">
                {list.map(([id, d]) => {
                  const open = meta.unlocked.includes(id)
                  const item = ITEMS[id]
                  return (
                    <div key={id} className={`cat-card ${open ? '' : 'locked'}`}>
                      <span className="cat-art">{item ? <svg viewBox={`-0.3 -0.3 ${item.w + 0.6} ${item.h + 0.6}`} className="item-ico"><ItemSymbol type={id} w={item.w} h={item.h} /></svg> : <i className="room-swatch" style={{ background: d.color }} />}</span>
                      <b>{d.label}</b>
                      <em className="mono">{d.boost ? `+${(d.boost.f || 0)} F · +${(d.boost.a || 0)} A` : d.kind === 'floor' ? 'floor' : ''}</em>
                      <span className={`cat-lock g-${d.unlock}`}>{open ? <Icon name="check" size={11} stroke={3} /> : <Icon name="lock" size={11} />}{d.unlock}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Review
export function Review({ entry, career, onContinue, onRetry, onAbandon }) {
  const b = BRIEFS[entry.briefId]
  const s = entry.scores
  const review = entry.review || {}
  const failed = entry.grade === 'F'
  const grade = GRADES.find(g => g.id === entry.grade)
  const [count, setCount] = useState(fxSettings.reduceMotion ? s.overall : 0)
  const [revealed, setRevealed] = useState(fxSettings.reduceMotion)
  const [openBar, setOpenBar] = useState(null)
  useEffect(() => {
    if (fxSettings.reduceMotion) return
    let raf, t0 = null, last = 0
    const timers = []
    const step = (now) => {
      t0 ??= now
      const k = Math.min(1, (now - t0) / 1100)
      const v = Math.round(s.overall * (1 - Math.pow(1 - k, 3)))
      if (v !== last && v % 3 === 0) feedback('tick')
      last = v
      setCount(v)
      if (k < 1) raf = requestAnimationFrame(step)
      else timers.push(setTimeout(() => { setRevealed(true); feedback(failed ? 'fail' : ['S', 'A'].includes(entry.grade) ? 'fanfare' : 'stamp') }, 150))
    }
    const start = setTimeout(() => { raf = requestAnimationFrame(step) }, 450)
    return () => { clearTimeout(start); cancelAnimationFrame(raf); timers.forEach(clearTimeout) }
  }, []) // eslint-disable-line
  const stampText = { S: 'MASTERPIECE', A: 'APPROVED', B: 'APPROVED', C: 'ACCEPTED', F: 'REJECTED' }[entry.grade]
  const struck = career.status === 'fired'
  return (
    <div className="page review">
      <header className="page-top"><span /><Brand small /><span /></header>
      <div className="page-body">
        <div className="review-hero">
          <div className="review-img-wrap">
            {entry.thumb ? <img src={entry.thumb} alt="" className="review-img" /> : <div className="review-img placeholder" />}
            <span className={`stamp ${failed ? 'bad' : ['S', 'A', 'B'].includes(entry.grade) ? '' : 'mid'}`}>{stampText}</span>
          </div>
          <div className="review-head">
            <span className="mono dim">REVIEW · {entry.client.toUpperCase()} · LEVEL {b.level}</span>
            <Title as="h2" light={b.name.split(' ').slice(0, -1).join(' ')} bold={b.name.split(' ').at(-1)} />
            <div className="big-score">
              <span className={`grade-reveal ${revealed ? 'in' : ''}`}><GradeBadge g={entry.grade} big /></span>
              <div><span className="num mono" aria-label={`${s.overall} out of 100`}>{count}</span><b>{grade.label}</b></div>
            </div>
            <p className="quote">{review.head}</p>
            {review.sGated && <p className="s-gate mono">90+ overall, but S needs every rating at 85+. So close.</p>}
          </div>
        </div>
        <div className="score-bars">
          {[['Functionality', s.functionality], ['Requirements', s.requirements], ['Aesthetics', s.aesthetics], ['Budget', s.budget ?? 0]].map(([k, v], i) => {
            const rows = review.breakdown?.[k.toLowerCase()] || []
            const isOpen = openBar === k
            return (
              <div key={k} className={`sbar-wrap ${isOpen ? 'open' : ''}`}>
                <button className="sbar" style={{ '--d': `${i * 0.15}s` }} disabled={!rows.length} aria-expanded={isOpen}
                  onClick={() => { feedback('tap'); setOpenBar(isOpen ? null : k) }}>
                  <span>{k}</span><div className="bar"><i style={{ width: `${v}%` }} className={v < 55 ? 'bad' : v < 70 ? 'mid' : ''} /></div><b className="mono">{v}</b>
                  {rows.length > 0 && <Icon name="chevron" size={14} />}
                </button>
                {isOpen && (
                  <ul className="sb-detail">
                    {rows.map((r, j) => (
                      <li key={j} className={r.value >= 0.9 ? 'good' : r.value >= 0.6 ? 'mid' : 'bad'}>
                        <span className="sb-dot" />
                        <div>
                          <b>{r.label}</b>{!r.check && <em className="mono"> {Math.round(r.value * 100)}%</em>}
                          {r.text && <p>{r.check ? <span className="mono">{r.text}</span> : r.text}</p>}
                          {r.detail?.length > 0 && <ul>{r.detail.map((d, n) => <li key={n}>{d}</li>)}</ul>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
          {review.breakdown && <p className="dim small sb-hint">Tap a rating to see why.</p>}
          <div className="grade-scale mono">{GRADES.slice().reverse().map(g => <span key={g.id} className={g.id === entry.grade ? 'on' : ''}>{g.id} {g.min ? `≥${g.min}` : ''}</span>)}</div>
        </div>
        <div className="crit">
          <div>
            <span className="mono dim">WHAT WORKED</span>
            <ul>{(review.praise || []).length ? review.praise.map((n, i) => <li key={i} className="good"><Icon name="check" size={14} />{n.text}</li>) : <li className="dim">Not much, honestly.</li>}</ul>
          </div>
          <div>
            <span className="mono dim">WHAT DIDN'T</span>
            <ul>{(review.gripes || []).length ? review.gripes.map((n, i) => <li key={i} className="bad"><Icon name="x" size={14} />{n.text}</li>) : <li className="dim">No complaints.</li>}</ul>
          </div>
        </div>

        {failed ? (
          <section className="fail-box">
            <h3>The client rejected the design.</h3>
            <p className="dim">An F doesn't pass the level and counts as a strike ({career.strikes}/{career.maxStrikes}). {struck ? 'That was your last chance: the studio closes.' : 'Revise this design and resubmit, or walk away from architecture.'}</p>
            <div className="row end wrap">
              {!struck && <button className="ghost" onClick={onAbandon}><Icon name="flag" size={18} />Abandon career</button>}
              {struck ? <button className="primary big" onClick={onAbandon}>See the career summary<Icon name="chevron" size={18} /></button>
                : <button className="primary big" onClick={onRetry}><Icon name="undo" size={18} />Retry this design</button>}
            </div>
          </section>
        ) : (
          <>
            <div className="earnings">
              <div><span className="mono dim">FEE</span><b className="ok">+{money(entry.fee)}</b></div>
              <div><span className="mono dim">NEXT LEVEL</span><b>{entry.fromLevel} → {entry.toLevel}{entry.toLevel > entry.fromLevel ? ' ▲' : entry.toLevel < entry.fromLevel ? ' ▼' : ''}</b></div>
              <div><span className="mono dim">REPUTATION</span><b>+{entry.rep}</b></div>
              <div><span className="mono dim">COST</span><b>{money(entry.cost, true)} / {money(entry.offer.budget, true)}</b></div>
            </div>
            {entry.unlocks?.length > 0 ? (
              <section className="unlock-reveal">
                <h3>Unlocked for every architect</h3>
                <div className="cat-grid">
                  {entry.unlocks.map((id, i) => {
                    const d = ITEMS[id] || MATERIALS[id]
                    const item = ITEMS[id]
                    return (
                      <div key={id} className="cat-card fresh" style={{ animationDelay: `${0.9 + i * 0.12}s` }}>
                        <span className="cat-art">{item ? <svg viewBox={`-0.3 -0.3 ${item.w + 0.6} ${item.h + 0.6}`} className="item-ico"><ItemSymbol type={id} w={item.w} h={item.h} /></svg> : <i className="room-swatch" style={{ background: d.color }} />}</span>
                        <b>{d.label}</b>
                        <span className={`cat-lock g-${d.unlock}`}>{d.unlock}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : <p className="dim small">{entry.grade === 'C' ? 'C passes the level but unlocks nothing. Aim for B or better.' : `You already own everything a ${entry.grade} unlocks in ${INDUSTRIES[b.industry].label.toLowerCase()}.`}</p>}
            <div className="row end"><button className="primary big" onClick={onContinue}>Continue<Icon name="chevron" size={18} /></button></div>
          </>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Career end
export function CareerEnd({ career, meta, title, onArchive }) {
  const earned = meta ? profilesEarned(meta, career) : []
  const founder = profileById(career.profile?.profileId)
  const n = career.portfolio.length
  const avg = n ? Math.round(career.portfolio.reduce((s, p) => s + p.scores.overall, 0) / n) : 0
  const head = { fired: 'THE STUDIO HAS CLOSED', abandoned: 'YOU WALKED AWAY', retired: 'RETIREMENT' }[career.status] || 'CAREER OVER'
  return (
    <div className="page end">
      <header className="page-top"><span /><Brand small /><span /></header>
      <div className="page-body">
        <span className="mono dim">{head}</span>
        <h1 className="display-xl">{career.name}</h1>
        <p className="lead">“{title}”</p>
        <div className="end-stats">
          <div><span className="mono dim">COMMISSIONS</span><b>{n}</b></div>
          <div><span className="mono dim">AVERAGE</span><b>{avg}</b></div>
          <div><span className="mono dim">TOP LEVEL</span><b>{Math.max(0, ...career.portfolio.map(p => p.offer.level))}</b></div>
          <div><span className="mono dim">FINAL RANK</span><b className="small">{rankFor(career.rep).title}</b></div>
        </div>
        {earned.length > 0 && (
          <section className="prof-unlock">
            <span className="mono dim">CAREER COMPLETE · NEW ARCHITECTS</span>
            <p>{founder?.name.split(' ')[0]}'s studio trained four specialists. They're ready for their own careers.</p>
            <div className="pu-row">{earned.map(id => { const p = profileById(id); return <div key={id} className="pu"><img src={`${import.meta.env.BASE_URL}art/architects/${p.avatar}.jpg`} alt="" /><b>{p.title}</b></div> })}</div>
          </section>
        )}
        {founder?.base && !earned.length && career.portfolio.length < COMPLETE_AT && !(meta?.profilesUnlocked || []).some(id => profileById(id)?.unlockBy === founder.id) && (
          <p className="dim small">Finish a founder career with {COMPLETE_AT}+ approved commissions to unlock four specialist architects.</p>
        )}
        <h3>Portfolio</h3>
        <Portfolio works={career.portfolio.map(p => ({ briefId: p.briefId, client: p.client, overall: p.scores.overall, grade: p.grade, thumb: p.thumb }))} />
        <div className="sticky-cta"><button className="primary big" onClick={onArchive}><Icon name="trophy" size={18} />Add to the legacy hall</button></div>
      </div>
    </div>
  )
}

function Portfolio({ works }) {
  if (!works.length) return <p className="dim">Nothing built. Not yet.</p>
  return (
    <div className="portfolio">
      {works.map((w, i) => (
        <figure key={i} className="work">
          {w.thumb ? <img src={w.thumb} alt="" /> : <div className="ph" />}
          <figcaption><b>{BRIEFS[w.briefId]?.name}</b><span className="dim small">{w.client}</span><span className="row">{w.grade && <GradeBadge g={w.grade} />}<span className="mono">{w.overall}</span></span></figcaption>
        </figure>
      ))}
    </div>
  )
}

export function Legacy({ meta, onBack }) {
  return (
    <div className="page">
      <header className="page-top"><button className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="back" /></button><Brand small /><span /></header>
      <div className="page-body">
        <Title as="h2" light="Legacy" bold="hall" />
        {!meta.legacy.length && <p className="dim">No architect has finished a career yet. Yours will be the first plaque on the wall.</p>}
        {meta.legacy.map(l => (
          <section key={l.id} className="plaque">
            <div className="plaque-head">
              <div className="row"><Avatar name={l.name} profile={l.profile || {}} size={52} /><div><h3>{l.name}</h3><p className="dim">“{l.title}” · {l.rank}{l.profile?.background ? ` · ${BACKGROUNDS[l.profile.background]?.label}` : ''}</p></div></div>
              <div className="plaque-stats mono"><span>{l.commissions} works</span><span>avg {l.average}</span><span>top L{l.topLevel ?? '–'}</span><span className={l.status !== 'retired' ? 'bad' : ''}>{l.status}</span></div>
            </div>
            <Portfolio works={l.works} />
          </section>
        ))}
      </div>
    </div>
  )
}

export function WorkModal({ work, onClose }) {
  const p = work.project
  const [view, setView] = useState('exterior')
  const [lvl, setLvl] = useState(0)
  const views = p ? [['exterior', 'Exterior', 'cube'], ['cutaway', 'Cutaway', 'section'], ['plan', 'Plan', 'plan'], ['night', 'Night', 'moon']] : []
  return (
    <Window onClose={onClose} className="work-win" label={BRIEFS[work.briefId].name}>
      {(close) => (<>
        <div className="work-3d">
          {!p ? <img src={work.thumb} alt="" />
            : view === 'plan' ? <PlanView project={p} li={lvl} tool="select" onTap={() => {}} />
              : <View3D project={p} cutLevel={view === 'cutaway' ? lvl : null} night={view === 'night'} />}
          {p && (
            <div className="work-views">
              {views.map(([id, label, icon]) => <button key={id} className={`chip ${view === id ? 'on' : ''}`} onClick={() => { feedback('tap'); setView(id) }}><Icon name={icon} size={15} />{label}</button>)}
            </div>
          )}
          {p && (view === 'cutaway' || view === 'plan') && p.levels.length > 1 && (
            <div className="work-levels">{[...p.levels.keys()].reverse().map(i => <button key={i} className={`lvl ${i === lvl ? 'on' : ''}`} onClick={() => setLvl(i)}>L{i + 1}</button>)}</div>
          )}
        </div>
        <div className="row between">
          <div className="row"><ProjectArt briefId={work.briefId} size={44} /><div><h3>{BRIEFS[work.briefId].name}</h3><p className="dim small">{work.client}</p></div></div>
          <div className="row"><GradeBadge g={work.grade} /><b className="mono">{work.scores.overall}</b></div>
        </div>
        <div className="row mono dim small wrap"><span>F {work.scores.functionality}</span><span>R {work.scores.requirements}</span><span>A {work.scores.aesthetics}</span><span>B {work.scores.budget ?? '–'}</span><span>+{money(work.fee || 0, true)}</span></div>
      </>)}
    </Window>
  )
}
