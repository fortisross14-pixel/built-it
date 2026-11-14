import React, { useEffect, useMemo, useState } from 'react'
import { feedback, onSettings, setSetting, settings as fxSettings } from './fx.js'
import Icon from './icons.jsx'
import Card from './Card.jsx'
import View3D from './View3D.jsx'
import { BRIEFS, TIERS, TWISTS } from '../game/briefs.js'
import { CARDS, kitSlots } from '../game/cards.js'
import { STYLES } from '../game/catalog.js'
import { RANKS, randomArchitect, rankFor, repGain, tierFor } from '../engine/career.js'
import { STAR_LABEL } from '../engine/score.js'
import { referenceCafe } from '../game/demo.js'
import { money } from './format.js'

export function Stars({ n, size = 16, shown = null }) {
  return <span className={`stars ${shown !== null ? 'reveal' : ''}`} aria-label={`${n} stars`}>{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={size} fill={i <= n ? 'currentColor' : 'none'} className={`${i <= n ? 'on' : ''} ${shown === null || i <= shown ? 'shown' : ''}`} />)}</span>
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

// ------------------------------------------------------------------ Home
export function Home({ meta, career, onContinue, onNew, onCollection, onLegacy }) {
  const demo = useMemo(() => {
    const last = career?.portfolio?.at(-1)?.project || meta.legacy[0]?.best?.project
    return last || referenceCafe()
  }, [career, meta])
  const owned = meta.collection.length, total = Object.keys(CARDS).length
  return (
    <div className="home">
      <div className="home-hero">
        <View3D project={demo} autoRotate interactive={false} className="hero-3d" zoom={1.45} />
        <div className="hero-fade" />
      </div>
      <div className="home-panel">
        <div className="row between"><Brand /><SettingsButton /></div>
        <h1>Build a name.<br />One commission at a time.</h1>
        <p className="lead">You're a young architect with a drawing board and no clients. Design cafés, then clinics, then towers. Every review counts: three disasters and the studio closes. When your career ends, the next architect inherits your cards.</p>
        <div className="home-actions">
          {career && career.status === 'active' && (
            <button className="primary big" onClick={onContinue}><Icon name="play" size={18} />Continue {career.name}<span className="mono dim">{rankFor(career.rep).title} · {career.portfolio.length}/{career.maxCommissions}</span></button>
          )}
          {career && career.status !== 'active' && (
            <button className="primary big" onClick={onContinue}><Icon name="flag" size={18} />Close out {career.name}'s career</button>
          )}
          <button className={career ? 'ghost big' : 'primary big'} onClick={onNew}><Icon name="plus" size={18} />{career ? 'New architect' : 'Start your career'}</button>
          <div className="row">
            <button className="ghost" onClick={onCollection}><Icon name="cards" size={18} />Cards <span className="mono dim">{owned}/{total}</span></button>
            <button className="ghost" onClick={onLegacy}><Icon name="trophy" size={18} />Legacy <span className="mono dim">{meta.legacy.length}</span></button>
          </div>
        </div>
        <div className="loop mono">
          <span>COMMISSION</span><Icon name="chevron" size={14} /><span>DESIGN</span><Icon name="chevron" size={14} /><span>REVIEW</span><Icon name="chevron" size={14} /><span>REPUTATION</span><Icon name="chevron" size={14} /><span>CARDS</span>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ New career
export function NewCareer({ meta, onStart, onBack, warnReplace }) {
  const [name, setName] = useState(() => randomArchitect())
  const slots = kitSlots(meta.legacy.length)
  const [kit, setKit] = useState(() => meta.collection.slice(0, slots))
  const toggle = (id) => setKit(k => k.includes(id) ? k.filter(x => x !== id) : k.length < slots ? [...k, id] : k)
  return (
    <div className="page">
      <header className="page-top"><button className="icon-btn" onClick={onBack}><Icon name="back" /></button><Brand small /><span /></header>
      <div className="page-body narrow">
        <span className="mono dim">ARCHITECT #{meta.careers + 1}</span>
        <h2>Open a new studio</h2>
        {warnReplace && <p className="warn">Your current architect's career will end and go to the legacy hall.</p>}
        <label className="field">
          <span className="mono dim">NAME ON THE DOOR</span>
          <div className="row">
            <input value={name} onChange={e => setName(e.target.value)} maxLength={28} />
            <button className="icon-btn" onClick={() => setName(randomArchitect(Date.now() + Math.random() * 1e6))} aria-label="Random name"><Icon name="dice" /></button>
          </div>
        </label>
        <div className="kit-head">
          <div>
            <h3>Studio kit</h3>
            <p className="dim small">Choose up to <b>{slots}</b> cards from your collection to bring into this career. Cards you earn along the way join the kit automatically.</p>
          </div>
          <span className="mono kit-count">{kit.length}/{slots}</span>
        </div>
        <div className="card-grid">
          {meta.collection.map(id => <Card key={id} id={id} selected={kit.includes(id)} onClick={() => toggle(id)} />)}
        </div>
        <div className="sticky-cta">
          <button className="primary big" disabled={!name.trim()} onClick={() => onStart({ name: name.trim(), kit })}><Icon name="building" size={18} />Open studio</button>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Hub
export function Hub({ career, onAccept, onResume, onHome, onRetire, onOpenWork }) {
  const [confirmRetire, setConfirmRetire] = useState(false)
  const rank = rankFor(career.rep)
  const nextRank = RANKS.find(r => r.rep > career.rep)
  const prevRep = rank.rep
  const pct = nextRank ? (career.rep - prevRep) / (nextRank.rep - prevRep) * 100 : 100
  const tier = tierFor(career.rep)
  const slots = Array.from({ length: career.maxCommissions }, (_, i) => career.portfolio[i] || null)
  return (
    <div className="page hub">
      <header className="page-top">
        <button className="icon-btn" onClick={onHome}><Icon name="back" /></button>
        <Brand small />
        <div className="row"><SettingsButton /><button className="ghost small" onClick={() => setConfirmRetire(true)}><Icon name="flag" size={16} /><span className="hide-xs">Retire</span></button></div>
      </header>
      <div className="page-body">
        <section className="architect">
          <div className="avatar">{career.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
          <div className="who">
            <span className="mono dim">STUDIO OF</span>
            <h2>{career.name}</h2>
            <span className="rank">{rank.title}</span>
          </div>
          <div className="stat rep">
            <span className="mono dim">REPUTATION</span>
            <b>{career.rep}</b>
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
            <span className="mono dim small">{nextRank ? `${nextRank.rep - career.rep} to ${nextRank.title}` : 'Top of the profession'}</span>
          </div>
          <div className="stat">
            <span className="mono dim">STRIKES</span>
            <div className="strikes">{Array.from({ length: career.maxStrikes }, (_, i) => <span key={i} className={i < career.strikes ? 'hit' : ''}><Icon name="x" size={16} stroke={2.6} /></span>)}</div>
            <span className="mono dim small">score &lt; 50 = strike</span>
          </div>
        </section>

        <section>
          <div className="sec-head"><h3>Career path</h3><span className="mono dim">{career.portfolio.length}/{career.maxCommissions} COMMISSIONS</span></div>
          <div className="timeline">
            {slots.map((p, i) => (
              <button key={i} className={`slot ${p ? (p.strike ? 'strike' : 'done') : i === career.portfolio.length ? 'next' : ''}`} onClick={() => p && onOpenWork(p)} disabled={!p}>
                {p?.thumb ? <img src={p.thumb} alt="" /> : <span className="mono">{String(i + 1).padStart(2, '0')}</span>}
                {p && <span className="slot-score mono">{p.scores.overall}</span>}
              </button>
            ))}
          </div>
          <div className="tiers">
            {TIERS.map(t => <span key={t.tier} className={`tier-pill ${tier >= t.tier ? 'on' : ''}`}><b>T{t.tier}</b> {t.name}{tier < t.tier && <em className="mono"> · {t.rep} rep</em>}</span>)}
          </div>
        </section>

        {career.current ? (
          <section className="resume">
            <div>
              <span className="mono dim">ON THE BOARD</span>
              <h3>{BRIEFS[career.current.offer.briefId].name}</h3>
              <p className="dim">{career.current.offer.client}</p>
            </div>
            <button className="primary big" onClick={onResume}><Icon name="play" size={18} />Back to the drawing board</button>
          </section>
        ) : (
          <section>
            <div className="sec-head"><h3>Commission board</h3><span className="mono dim">PICK ONE</span></div>
            <div className="offers">
              {career.offers.map(o => <OfferCard key={o.id} offer={o} kit={career.kit} rep={career.rep} onAccept={() => onAccept(o.id)} />)}
            </div>
          </section>
        )}

        <section>
          <div className="sec-head"><h3>Studio kit</h3><span className="mono dim">{career.kit.length} CARDS</span></div>
          {career.kit.length ? <div className="card-row">{career.kit.map(id => <Card key={id} id={id} small />)}</div> : <p className="dim">No cards yet. Score 3★ or more to earn some.</p>}
        </section>
      </div>
      {confirmRetire && (
        <div className="modal-wrap" onClick={() => setConfirmRetire(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Retire {career.name}?</h3>
            <p className="dim">The career ends now and the portfolio goes to the legacy hall. Your cards stay in the collection.</p>
            <div className="row end"><button className="ghost" onClick={() => setConfirmRetire(false)}>Not yet</button><button className="primary" onClick={onRetire}>Retire</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

function OfferCard({ offer, kit, onAccept }) {
  const b = BRIEFS[offer.briefId]
  const tw = offer.twist ? TWISTS[offer.twist] : null
  const best = repGain(92, offer, kit)
  return (
    <article className={`offer ${offer.locked ? 'locked' : ''}`}>
      <div className="offer-top">
        <span className="tier-badge mono">T{offer.tier}</span>
        <span className="mono dim">{offer.lot.w}×{offer.lot.h} m · {b.levels.min === b.levels.max ? `${b.levels.min} lvl` : `${b.levels.min}–${b.levels.max} lvl`}</span>
      </div>
      <h4>{b.name}</h4>
      <p className="client">{offer.client}</p>
      <p className="blurb">{b.blurb}</p>
      <div className="row wrap">{offer.styles.map(s => <span key={s} className="tag-chip">{STYLES[s]}</span>)}</div>
      {tw && <div className="twist small"><b>{tw.name}</b><span>{tw.text}</span></div>}
      <div className="offer-foot">
        <div><span className="mono dim">BUDGET</span><b>{money(offer.budget, true)}</b></div>
        <div><span className="mono dim">REP</span><b>up to +{best}</b></div>
        {offer.locked
          ? <span className="locked-note"><Icon name="lock" size={16} />Needs {offer.needRep} rep</span>
          : <button className="primary" onClick={onAccept}>Accept</button>}
      </div>
    </article>
  )
}

// ------------------------------------------------------------------ Review
export function Review({ entry, review, reward, onPick, onContinue }) {
  const [picked, setPicked] = useState(null)
  const b = BRIEFS[entry.briefId]
  const s = entry.scores
  const praise = review?.praise || []
  const gripes = review?.gripes || []
  // Reveal sequence: count the score up, then pop the stars one by one (game-feel: large tier).
  const [count, setCount] = useState(fxSettings.reduceMotion ? s.overall : 0)
  const [starsShown, setStarsShown] = useState(fxSettings.reduceMotion ? 5 : 0)
  useEffect(() => {
    if (fxSettings.reduceMotion) return
    let raf, t0 = null
    const timers = []
    const dur = 1100
    let lastShown = 0
    const step = (now) => {
      t0 ??= now
      const k = Math.min(1, (now - t0) / dur)
      const v = Math.round(s.overall * (1 - Math.pow(1 - k, 3)))
      if (v !== lastShown && v % 3 === 0) feedback('tick')
      lastShown = v
      setCount(v)
      if (k < 1) raf = requestAnimationFrame(step)
      else {
        for (let i = 1; i <= 5; i++) timers.push(setTimeout(() => { setStarsShown(i); if (i <= entry.stars) feedback('star', i) }, i * 130))
        timers.push(setTimeout(() => feedback(entry.strike ? 'fail' : entry.stars >= 4 ? 'fanfare' : 'select'), 5 * 130 + 120))
      }
    }
    const start = setTimeout(() => { raf = requestAnimationFrame(step) }, 450)
    return () => { clearTimeout(start); cancelAnimationFrame(raf); timers.forEach(clearTimeout) }
  }, []) // eslint-disable-line
  const stampText = entry.strike ? 'REJECTED' : entry.stars >= 4 ? 'APPROVED' : 'ACCEPTED'
  return (
    <div className="page review">
      <header className="page-top"><span /><Brand small /><span /></header>
      <div className="page-body">
        <div className="review-hero">
          <div className="review-img-wrap">
            {entry.thumb ? <img src={entry.thumb} alt="" className="review-img" /> : <div className="review-img placeholder" />}
            <span className={`stamp ${entry.strike ? 'bad' : entry.stars >= 4 ? '' : 'mid'}`}>{stampText}</span>
          </div>
          <div className="review-head">
            <span className="mono dim">REVIEW · {entry.client.toUpperCase()}</span>
            <h2>{b.name}</h2>
            <div className="big-score">
              <span className="num" aria-label={`${s.overall} out of 100`}>{count}</span>
              <div><Stars n={entry.stars} size={22} shown={starsShown} /><b>{STAR_LABEL[entry.stars]}</b></div>
            </div>
            <p className="quote">{review?.head}</p>
          </div>
        </div>
        <div className="score-bars">
          {[['Functionality', s.functionality], ['Requirements', s.requirements], ['Aesthetics', s.aesthetics], ['Budget', s.budget ?? 0]].map(([k, v], i) => (
            <div key={k} className="sbar" style={{ '--d': `${i * 0.15}s` }}>
              <span>{k}</span><div className="bar"><i style={{ width: `${v}%` }} className={v < 50 ? 'bad' : v < 70 ? 'mid' : ''} /></div><b className="mono">{v}</b>
            </div>
          ))}
        </div>
        <div className="crit">
          <div>
            <span className="mono dim">WHAT WORKED</span>
            <ul>{praise.length ? praise.map((n, i) => <li key={i} className="good"><Icon name="check" size={14} />{n.text}</li>) : <li className="dim">Not much, honestly.</li>}</ul>
          </div>
          <div>
            <span className="mono dim">WHAT DIDN'T</span>
            <ul>{gripes.length ? gripes.map((n, i) => <li key={i} className="bad"><Icon name="x" size={14} />{n.text}</li>) : <li className="dim">No complaints.</li>}</ul>
          </div>
        </div>
        <div className={`rep-change ${entry.rep < 0 ? 'neg' : ''}`}>
          <span className="mono">REPUTATION {entry.rep >= 0 ? '+' : ''}{entry.rep}</span>
          {entry.strike && <span className="strike-note"><Icon name="x" size={16} stroke={2.6} />Strike. Word gets around.</span>}
          <span className="mono dim">COST {money(entry.cost)} / {money(entry.offer.budget)}</span>
        </div>
        {reward && reward.choices.length > 0 ? (
          <section className="reward">
            <h3>The press noticed. Pick a card.</h3>
            <p className="dim small">It joins this career's kit right now and stays in your collection for every future architect.</p>
            <div className="card-grid three">{reward.choices.map(id => <Card key={id} id={id} fresh selected={picked === id} onClick={() => { feedback('card'); setPicked(id) }} />)}</div>
            <div className="row end"><button className="primary big" disabled={!picked} onClick={() => { feedback('place'); onPick(picked) }}>Take card<Icon name="chevron" size={18} /></button></div>
          </section>
        ) : (
          <div className="row end">
            {reward && <p className="dim small grow">{entry.stars < 3 ? 'Score 3★ or better to earn a card.' : 'You already own every card. Impressive.'}</p>}
            <button className="primary big" onClick={() => onPick(null)}>Continue<Icon name="chevron" size={18} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Career end
export function CareerEnd({ career, title, onArchive }) {
  const n = career.portfolio.length
  const avg = n ? Math.round(career.portfolio.reduce((s, p) => s + p.scores.overall, 0) / n) : 0
  return (
    <div className="page end">
      <header className="page-top"><span /><Brand small /><span /></header>
      <div className="page-body">
        <span className="mono dim">{career.status === 'fired' ? 'THE STUDIO HAS CLOSED' : 'RETIREMENT'}</span>
        <h2>{career.name}</h2>
        <p className="lead">“{title}”</p>
        <div className="end-stats">
          <div><span className="mono dim">COMMISSIONS</span><b>{n}</b></div>
          <div><span className="mono dim">AVERAGE</span><b>{avg}</b></div>
          <div><span className="mono dim">REPUTATION</span><b>{career.rep}</b></div>
          <div><span className="mono dim">FINAL RANK</span><b className="small">{rankFor(career.rep).title}</b></div>
        </div>
        <h3>Portfolio</h3>
        <Portfolio works={career.portfolio.map(p => ({ briefId: p.briefId, client: p.client, overall: p.scores.overall, stars: p.stars, thumb: p.thumb }))} />
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
          <figcaption><b>{BRIEFS[w.briefId]?.name}</b><span className="dim small">{w.client}</span><span className="row"><Stars n={w.stars} size={12} /><span className="mono">{w.overall}</span></span></figcaption>
        </figure>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------ Collection & legacy
export function Collection({ meta, onBack }) {
  const ids = Object.keys(CARDS)
  const kinds = [['material', 'Materials'], ['item', 'Special items'], ['perk', 'Studio perks']]
  return (
    <div className="page">
      <header className="page-top"><button className="icon-btn" onClick={onBack}><Icon name="back" /></button><Brand small /><span className="mono dim">{meta.collection.length}/{ids.length}</span></header>
      <div className="page-body">
        <h2>Card collection</h2>
        <p className="dim">Cards are permanent. Earn them with 3★+ reviews; better reviews draw rarer cards. Each new architect brings a kit of them.</p>
        {kinds.map(([k, label]) => (
          <section key={k}>
            <h3>{label}</h3>
            <div className="card-grid">{ids.filter(id => CARDS[id].kind === k).map(id => <Card key={id} id={id} owned={meta.collection.includes(id)} />)}</div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function Legacy({ meta, onBack }) {
  return (
    <div className="page">
      <header className="page-top"><button className="icon-btn" onClick={onBack}><Icon name="back" /></button><Brand small /><span /></header>
      <div className="page-body">
        <h2>Legacy hall</h2>
        {!meta.legacy.length && <p className="dim">No architect has finished a career yet. Yours will be the first plaque on the wall.</p>}
        {meta.legacy.map(l => (
          <section key={l.id} className="plaque">
            <div className="plaque-head">
              <div><h3>{l.name}</h3><p className="dim">“{l.title}” · {l.rank}</p></div>
              <div className="plaque-stats mono"><span>{l.commissions} works</span><span>avg {l.average}</span><span>{l.rep} rep</span><span className={l.status === 'fired' ? 'bad' : ''}>{l.status === 'fired' ? 'closed' : 'retired'}</span></div>
            </div>
            <Portfolio works={l.works} />
          </section>
        ))}
      </div>
    </div>
  )
}

export function WorkModal({ work, onClose }) {
  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal work-modal" onClick={e => e.stopPropagation()}>
        <div className="work-3d">{work.project ? <View3D project={work.project} /> : <img src={work.thumb} alt="" />}</div>
        <div className="row between">
          <div><h3>{BRIEFS[work.briefId].name}</h3><p className="dim small">{work.client}</p></div>
          <div className="row"><Stars n={work.stars} /><b className="mono">{work.scores.overall}</b></div>
        </div>
        <div className="row mono dim small"><span>F {work.scores.functionality}</span><span>R {work.scores.requirements}</span><span>A {work.scores.aesthetics}</span><span>B {work.scores.budget ?? '–'}</span><span>{work.rep >= 0 ? '+' : ''}{work.rep} rep</span></div>
        <div className="row end"><button className="ghost" onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}
