import React from 'react'

const glyphs = {
  ArrowLeft:'←', BarChart3:'▥', Building2:'▤', Check:'✓', ChevronRight:'›', CircleDollarSign:'$', Clock3:'◷',
  Copy:'⧉', Eraser:'⌫', Eye:'◉', FastForward:'»', Grid3X3:'▦', Hammer:'⌁', Home:'⌂', Layers3:'≡', MousePointer2:'↖',
  Pause:'Ⅱ', Play:'▶', RotateCcw:'↺', Save:'▣', Sparkles:'✦', Star:'★', Trash2:'×', Undo2:'↶', Redo2:'↷', Users:'●',
  Route:'⌁', Sun:'☼', Armchair:'▰', AlertTriangle:'!', CarFront:'▱', Coffee:'C', PanelTop:'▥', Gauge:'◒', X:'×'
}

function icon(name){
  return function Icon({size=18,className='',...props}){
    return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="1.2" y="1.2" width="21.6" height="21.6" rx="5" stroke="currentColor" strokeWidth="1.25" opacity=".18"/>
      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" fontFamily="ui-monospace, monospace">{glyphs[name]||'·'}</text>
    </svg>
  }
}

export const ArrowLeft=icon('ArrowLeft'), BarChart3=icon('BarChart3'), Building2=icon('Building2'), Check=icon('Check'), ChevronRight=icon('ChevronRight'), CircleDollarSign=icon('CircleDollarSign'), Clock3=icon('Clock3'), Copy=icon('Copy'), Eraser=icon('Eraser'), Eye=icon('Eye'), FastForward=icon('FastForward'), Grid3X3=icon('Grid3X3'), Hammer=icon('Hammer'), Home=icon('Home'), Layers3=icon('Layers3'), MousePointer2=icon('MousePointer2'), Pause=icon('Pause'), Play=icon('Play'), RotateCcw=icon('RotateCcw'), Save=icon('Save'), Sparkles=icon('Sparkles'), Star=icon('Star'), Trash2=icon('Trash2'), Undo2=icon('Undo2'), Redo2=icon('Redo2'), Users=icon('Users'), Route=icon('Route'), Sun=icon('Sun'), Armchair=icon('Armchair'), AlertTriangle=icon('AlertTriangle'), CarFront=icon('CarFront'), Coffee=icon('Coffee'), PanelTop=icon('PanelTop'), Gauge=icon('Gauge'), X=icon('X')
