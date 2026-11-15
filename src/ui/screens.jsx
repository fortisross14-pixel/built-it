import React, { useEffect, useMemo, useState } from 'react'
import { feedback, onSettings, setSetting, settings as fxSettings } from './fx.js'
import Icon from './icons.jsx'
import View3D from './View3D.jsx'
import { ItemSymbol } from './PlanView.jsx'
import { BRIEFS, GRADES, TWISTS } from '../game/briefs.js'
import { INDUSTRIES, ITEMS, MATERIALS, ROOMS, STYLES } from '../game/catalog.js'
import { PACKS, packContents } from '../game/packs.js'
import { MAX_LEVEL, RANKS, feeFor, randomArchitect, rankFor } from '../engine/career.js'
import { referenceCafe } from '../game/demo.js'
import { BACKGROUNDS, COUNTRIES, GENDERS, countryName, flag } from '../game/architects.js'
import ProjectArt from './ProjectArt.jsx'
import PlanView from './PlanView.jsx'
import { money } from './format.js'

const GRADE_COLOR = { S: 'g-s', A: 'g-a', B: 'g-b', C: 'g-c', F: 'g-f' }

export function Stars({ n, size = 16, shown = null }) {
  return <span className={`stars ${shown !== null ? 'reveal' : ''}`} aria-label={`${n} stars`}>{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={size} fill={i <= n ? 'currentColor' : 'none'} className={`${i <= n ? 'on' : ''} ${shown === null || i <= shown ? 'shown' : ''}`} />)}</span>
}

export function GradeBadge({ g, big }) {
  return <span className={`grade ${GRADE_COLOR[g] || ''} ${big ? 'big' : ''}`}>{g}</span>
}

// ------------------------------------------------------------------ Settings
export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [s, setS] = useState(fxSettings)
  useEffect(() => onSettings(setS), [])
  const rows = [
    ['sound', 'Sound', 'Clicks, stamps and fanfares'],
    ['haptics', 'Haptics', 'Vibration on supported phones'],
    ['reduceMotion', 'Reduce motion', 'Calmer transitions, no camera glides'],
  ]
  return (
    <>
      <button className="icon-btn" onClick={() => { feedback('tap'); setOpen(true) }} aria-label="Settings"><Icon name="gear" /></button>
      {open && (
        <div className="modal-wrap" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Settings">
            <h3>Settings</h3>
            <span className="mono dim">STYLE</span>
            <div className="theme-pick">
              {[['studio', 'Drafting Studio'], ['blueprint', 'Blueprint'], ['atelier', 'Atelier']].map(([id, label]) => (
                <button key={id} className={s.theme === id ? 'on' : ''} onClick={() => { setSetting('theme', id); feedback('select') }}>
                  <span className={`sample ${id}`}><i /><b /></span>{label}
                </button>
              ))}
            </div>
            <div className="settings-list">
              {rows.map(([k, label, hint]) => (
                <button key={k} className="toggle-row" role="switch" aria-checked={!!s[k]} onClick={() => { setSetting(k, !s[k]); feedback('select') }}>
                  <span><b>{label}</b><small>{hint}</small></span><i className={`switch ${s[k] ? 'on' : ''}`} />
                </button>
              ))}
            </div>
            <div className="row end"><button className="primary" onClick={() => setOpen(false)} autoFocus>Done</button></div>
          </div>
        </div>
      )}
    </>
  )
}

function Brand({ small }) {
  return <div className={`brand ${small ? 'small' : ''}`}><span className="brand-mark">B</span><span className="brand-word">BUILT</span></div>
}

const unlockables = () => [...Object.entries(ITEMS), ...Object.entries(MATERIALS)].filter(([, d]) => d.unlock)

// ------------------------------------------------------------------ Home
export function Home({ meta, career, onContinue, onNew, onUnlocks, onLegacy }) {
  const demo = useMemo(() => {
    const last = career?.portfolio?.at(-1)?.project || meta.legacy[0]?.best?.project
    return last || referenceCafe()
  }, [career, meta])
  const total = unlockables().length
  return (
    <div className="home">
      <div className="home-hero">
        <View3D project={demo} autoRotate interactive={false} className="hero-3d" zoom={1.45} />
        <div className="hero-fade" />
      </div>
      <div className="home-panel">
        <div className="row between"><Brand /><SettingsButton /></div>
        <h1>Build a name.<br />One commission at a time.</h1>
        <p className="lead">Start with a corner shop. Grade well and the work grows: restaurants, museums, stadiums, an airport. Each grade unlocks better pieces for every architect after you. Fees buy supplies for this one.</p>
        <div className="home-actions">
          {career && career.status === 'active' && (
            <button className="primary big" onClick={onContinue}><Icon name="play" size={18} />Continue {career.name}<span className="mono dim">Level {career.level} · {money(career.cash, true)}</span></button>
          )}
          {career && career.status !== 'active' && (
            <button className="primary big" onClick={onContinue}><Icon name="flag" size={18} />Close out {career.name}'s career</button>
          )}
          <button className={career ? 'ghost big' : 'primary big'} onClick={onNew}><Icon name="plus" size={18} />{career ? 'New architect' : 'Start your career'}</button>
          <div className="row">
            <button className="ghost" onClick={onUnlocks}><Icon name="lock" size={18} />Unlocks <span className="mono dim">{meta.unlocked.length}/{total}</span></button>
            <button className="ghost" onClick={onLegacy}><Icon name="trophy" size={18} />Legacy <span className="mono dim">{meta.legacy.length}</span></button>
          </div>
        </div>
        <div className="loop mono">
          <span>COMMISSION</span><Icon name="chevron" size={14} /><span>DESIGN</span><Icon name="chevron" size={14} /><span>GRADE F·C·B·A·S</span><Icon name="chevron" size={14} /><span>UNLOCK</span><Icon name="chevron" size={14} /><span>CLIMB</span>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ New career
export function NewCareer({ meta, onStart, onBack, warnReplace }) {
  const [name, setName] = useState(() => randomArchitect())
  const [age, setAge] = useState(27)
  const [gender, setGender] = useState('Prefer not to say')
  const [country, setCountry] = useState('')
  const [background, setBackground] = useState('architect')
  return (
    <div className="page">
      <header className="page-top"><button className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="back" /></button><Brand small /><span /></header>
      <div className="page-body narrow">
        <span className="mono dim">ARCHITECT #{meta.careers + 1}</span>
        <h2>Who's opening the studio?</h2>
        {warnReplace && <p className="warn">Your current architect's career will end and go to the legacy hall.</p>}
        <div className="profile-card">
          <div className="avatar big">{name.split(' ').map(x => x[0]).join('').slice(0, 2)}<span className="avatar-flag">{flag(country)}</span></div>
          <div className="profile-fields">
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
        <div className="field">
          <span className="mono dim">BACKGROUND</span>
          <div className="bg-grid">
            {Object.entries(BACKGROUNDS).map(([id, b]) => (
              <button key={id} className={`bg-card ${background === id ? 'on' : ''}`} onClick={() => { feedback('select'); setBackground(id) }}>
                <Icon name={b.icon} size={22} /><b>{b.label}</b><span>{b.text}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="info-grid">
          <div><Icon name="flag" /><b>Start at level 1</b><span>Your first client is one of three basics: a boutique, a fast-food counter or a corner grocery.</span></div>
          <div><Icon name="lock" /><b>{meta.unlocked.length} permanent unlocks</b><span>Everything earlier architects unlocked with B, A and S grades is yours from day one.</span></div>
        </div>
        <div className="sticky-cta">
          <button className="primary big" disabled={!name.trim()} onClick={() => onStart({ name: name.trim(), profile: { age, gender, country, background } })}><Icon name="building" size={18} />Open studio</button>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Hub
function Ladder({ career }) {
  const byLevel = {}
  career.portfolio.forEach(p => { (byLevel[p.offer.level] ||= []).push(p) })
  return (
    <div className="ladder" role="list" aria-label="Difficulty ladder">
      {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(l => {
        const briefs = Object.values(BRIEFS).filter(b => b.level === l)
        return (
          <div key={l} role="listitem" className={`rung ${l === career.level ? 'now' : ''} ${l < career.level ? 'past' : ''}`}>
            <span className="rung-n mono">{l}</span>
            <div className="rung-icons">{briefs.slice(0, 3).map(b => <Icon key={b.name} name={INDUSTRIES[b.industry].icon} size={14} />)}</div>
            <div className="rung-done">{(byLevel[l] || []).map((p, i) => <GradeBadge key={i} g={p.grade} />)}</div>
            {l === career.level && <span className="rung-you mono">YOU</span>}
          </div>
        )
      })}
    </div>
  )
}

export function Hub({ career, meta, onAccept, onResume, onHome, onRetire, onOpenWork, onShop, onUnlocks }) {
  const [confirmRetire, setConfirmRetire] = useState(false)
  const [openOffer, setOpenOffer] = useState(null)
  const rank = rankFor(career.rep)
  const nextRank = RANKS.find(r => r.rep > career.rep)
  const slots = Array.from({ length: career.maxCommissions }, (_, i) => career.portfolio[i] || null)
  return (
    <div className="page hub">
      <header className="page-top">
        <button className="icon-btn" onClick={onHome} aria-label="Home"><Icon name="back" /></button>
        <Brand small />
        <div className="row"><SettingsButton /><button className="ghost small" onClick={() => setConfirmRetire(true)}><Icon name="flag" size={16} /><span className="hide-xs">Retire</span></button></div>
      </header>
      <div className="page-body">
        <section className="architect">
          <div className="avatar">{career.name.split(' ').map(s => s[0]).join('').slice(0, 2)}{career.profile?.country && <span className="avatar-flag">{flag(career.profile.country)}</span>}</div>
          <div className="who">
            <span className="mono dim">STUDIO OF</span>
            <h2>{career.name}</h2>
            {career.profile && <span className="profile-line mono dim">{[career.profile.age && `${career.profile.age}`, career.profile.country && countryName(career.profile.country), BACKGROUNDS[career.profile.background]?.label].filter(Boolean).join(' · ').toUpperCase()}</span>}
            <span className="rank">{rank.title}{nextRank && <em className="mono dim"> · {nextRank.rep - career.rep} rep to {nextRank.title}</em>}</span>
          </div>
          <div className="stat">
            <span className="mono dim">CASH</span>
            <b>{money(career.cash)}</b>
            <button className="ghost small" onClick={onShop}><Icon name="bag" size={16} />Supplier catalogue</button>
          </div>
          <div className="stat">
            <span className="mono dim">STRIKES</span>
            <div className="strikes">{Array.from({ length: career.maxStrikes }, (_, i) => <span key={i} className={i < career.strikes ? 'hit' : ''}><Icon name="x" size={16} stroke={2.6} /></span>)}</div>
            <span className="mono dim small">an F = strike</span>
          </div>
        </section>

        <section>
          <div className="sec-head"><h3>Difficulty ladder</h3><span className="mono dim">S +2 · A +1 · B +1 · C −1</span></div>
          <Ladder career={career} />
        </section>

        {career.current ? (
          <section className="resume">
            <div>
              <span className="mono dim">ON THE BOARD{career.current.attempts ? ` · ATTEMPT ${career.current.attempts + 1}` : ''}</span>
              <h3>{BRIEFS[career.current.offer.briefId].name}</h3>
              <p className="dim">{career.current.offer.client}</p>
            </div>
            <button className="primary big" onClick={onResume}><Icon name="play" size={18} />Back to the drawing board</button>
          </section>
        ) : (
          <section>
            <div className="sec-head"><h3>Commission board</h3><span className="mono dim">LEVEL {career.level}</span></div>
            <div className="offers">
              {career.offers.map(o => <OfferTile key={o.id} offer={o} meta={meta} onOpen={() => { feedback('tap'); setOpenOffer(o) }} />)}
            </div>
          </section>
        )}

        <section>
          <div className="sec-head"><h3>Portfolio</h3><span className="mono dim">{career.portfolio.length}/{career.maxCommissions} COMMISSIONS</span></div>
          <div className="timeline">
            {slots.map((p, i) => (
              <button key={i} className={`slot ${p ? 'done' : i === career.portfolio.length ? 'next' : ''}`} onClick={() => p && onOpenWork(p)} disabled={!p}>
                {p?.thumb ? <img src={p.thumb} alt="" /> : <span className="mono">{String(i + 1).padStart(2, '0')}</span>}
                {p && <span className="slot-score"><GradeBadge g={p.grade} /></span>}
              </button>
            ))}
          </div>
          <div className="row wrap hub-links">
            <button className="ghost small" onClick={onUnlocks}><Icon name="lock" size={16} />Permanent unlocks · {meta.unlocked.length}</button>
            <span className="dim small">Supplies owned: {career.packs.length ? career.packs.map(id => PACKS[id].name).join(', ') : 'none yet'}</span>
          </div>
        </section>
      </div>
      {openOffer && <OfferSheet offer={openOffer} meta={meta} onClose={() => setOpenOffer(null)} onAccept={() => { setOpenOffer(null); onAccept(openOffer.id) }} />}
      {confirmRetire && (
        <div className="modal-wrap" onClick={() => setConfirmRetire(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Retire {career.name}?</h3>
            <p className="dim">The career ends now and the portfolio goes to the legacy hall. Permanent unlocks stay for every architect; supplier packs and cash do not.</p>
            <div className="row end"><button className="ghost" onClick={() => setConfirmRetire(false)}>Not yet</button><button className="primary" onClick={onRetire}>Retire</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

const TAGS = { match: ['At your level', ''], safe: ['Safer job', 'safe'], stretch: ['Stretch', 'stretch'], basic: ['First job', ''], teaser: ['Score S to reach', 'teaser'] }

function OfferTile({ offer, meta, onOpen }) {
  const b = BRIEFS[offer.briefId]
  const [tagLabel, tagClass] = TAGS[offer.tag] || TAGS.match
  const best = meta.best?.[offer.briefId]
  return (
    <button className={`offer-tile ${offer.locked ? 'locked' : ''}`} onClick={onOpen}>
      <ProjectArt briefId={offer.briefId} size={72} />
      <span className="ot-body">
        <span className="ot-top"><span className="tier-badge mono">LV {offer.level}</span><span className={`offer-tag ${tagClass}`}>{tagLabel}</span>{offer.twist && <Icon name="info" size={14} className="ot-twist" />}</span>
        <b>{b.name}</b>
        <span className="mono dim">{money(offer.budget, true)} · {offer.lot.w}×{offer.lot.h} m{best ? ' · best ' : ''}{best && <GradeBadge g={best} />}</span>
      </span>
      {offer.locked ? <Icon name="lock" size={18} className="ot-go" /> : <Icon name="chevron" size={18} className="ot-go" />}
    </button>
  )
}

function OfferSheet({ offer, meta, onClose, onAccept }) {
  const b = BRIEFS[offer.briefId]
  const tw = offer.twist ? TWISTS[offer.twist] : null
  const [tagLabel, tagClass] = TAGS[offer.tag] || TAGS.match
  const best = meta.best?.[offer.briefId]
  const roomsList = b.rooms.map(r => `${r.count > 1 ? `${r.count}× ` : ''}${ROOMS[r.type].label} ≥ ${r.min} m²`)
  const itemsN = b.items.reduce((s, it) => s + (it.count || 1), 0)
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet offer-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={b.name}>
        <div className="os-hero">
          <ProjectArt briefId={offer.briefId} size={112} />
          <div>
            <span className="row"><span className="tier-badge mono">LEVEL {offer.level}</span><span className={`offer-tag ${tagClass}`}>{tagLabel}</span></span>
            <h3>{b.name}</h3>
            <p className="client">{offer.client}</p>
            <span className="mono dim ind"><Icon name={INDUSTRIES[b.industry].icon} size={14} /> {INDUSTRIES[b.industry].label}{best && <> · your studio's best <GradeBadge g={best} /></>}</span>
          </div>
          <button className="icon-btn os-close" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="sheet-body">
          <p className="blurb">{b.blurb}</p>
          <div className="os-facts">
            <div><span className="mono dim">BUDGET</span><b>{money(offer.budget, true)}</b></div>
            <div><span className="mono dim">FEE AT S</span><b>{money(Math.round(feeFor(offer.level) * 1.6 * (tw?.fee || 1)), true)}</b></div>
            <div><span className="mono dim">LOT</span><b>{offer.lot.w}×{offer.lot.h} m</b></div>
            <div><span className="mono dim">FLOORS</span><b>{b.levels.min === b.levels.max ? b.levels.min : `${b.levels.min}–${b.levels.max}`}</b></div>
          </div>
          <div className="row wrap"><span className="mono dim">CLIENT TASTE</span>{offer.styles.map(st => <span key={st} className="tag-chip">{STYLES[st]}</span>)}</div>
          {tw && <div className="twist"><b>{tw.name}</b><span>{tw.text}</span></div>}
          <div className="os-program">
            <span className="mono dim">PROGRAM</span>
            <ul>{roomsList.map((t, i) => <li key={i}>{t}</li>)}</ul>
            <span className="dim small">{itemsN} required pieces of furniture and equipment{b.needsLift && b.levels.max > 1 ? ' · lift required' : ''}</span>
          </div>
        </div>
        <div className="os-foot">
          {offer.locked
            ? <span className="locked-note"><Icon name="lock" size={16} />Score S on your next project to reach this level</span>
            : <button className="primary big" onClick={() => { feedback('stamp'); onAccept() }}><Icon name="stamp" size={18} />Accept project</button>}
        </div>
      </div>
    </div>
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
          <h2>Supplier catalogue</h2>
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
          <h2>Permanent unlocks</h2>
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
            <div className="row"><ProjectArt briefId={entry.briefId} size={44} /><h2>{b.name}</h2></div>
            <div className="big-score">
              <span className={`grade-reveal ${revealed ? 'in' : ''}`}><GradeBadge g={entry.grade} big /></span>
              <div><span className="num mono" aria-label={`${s.overall} out of 100`}>{count}</span><b>{grade.label}</b></div>
            </div>
            <p className="quote">{review.head}</p>
          </div>
        </div>
        <div className="score-bars">
          {[['Functionality', s.functionality], ['Requirements', s.requirements], ['Aesthetics', s.aesthetics], ['Budget', s.budget ?? 0]].map(([k, v], i) => (
            <div key={k} className="sbar" style={{ '--d': `${i * 0.15}s` }}>
              <span>{k}</span><div className="bar"><i style={{ width: `${v}%` }} className={v < 55 ? 'bad' : v < 70 ? 'mid' : ''} /></div><b className="mono">{v}</b>
            </div>
          ))}
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
export function CareerEnd({ career, title, onArchive }) {
  const n = career.portfolio.length
  const avg = n ? Math.round(career.portfolio.reduce((s, p) => s + p.scores.overall, 0) / n) : 0
  const head = { fired: 'THE STUDIO HAS CLOSED', abandoned: 'YOU WALKED AWAY', retired: 'RETIREMENT' }[career.status] || 'CAREER OVER'
  return (
    <div className="page end">
      <header className="page-top"><span /><Brand small /><span /></header>
      <div className="page-body">
        <span className="mono dim">{head}</span>
        <h2>{career.name}</h2>
        <p className="lead">“{title}”</p>
        <div className="end-stats">
          <div><span className="mono dim">COMMISSIONS</span><b>{n}</b></div>
          <div><span className="mono dim">AVERAGE</span><b>{avg}</b></div>
          <div><span className="mono dim">TOP LEVEL</span><b>{Math.max(0, ...career.portfolio.map(p => p.offer.level))}</b></div>
          <div><span className="mono dim">FINAL RANK</span><b className="small">{rankFor(career.rep).title}</b></div>
        </div>
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
        <h2>Legacy hall</h2>
        {!meta.legacy.length && <p className="dim">No architect has finished a career yet. Yours will be the first plaque on the wall.</p>}
        {meta.legacy.map(l => (
          <section key={l.id} className="plaque">
            <div className="plaque-head">
              <div><h3>{l.profile?.country ? `${flag(l.profile.country)} ` : ''}{l.name}</h3><p className="dim">“{l.title}” · {l.rank}{l.profile?.background ? ` · ${BACKGROUNDS[l.profile.background]?.label}` : ''}</p></div>
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
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal work-modal" onClick={e => e.stopPropagation()}>
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
        <div className="row end"><button className="ghost" onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}
