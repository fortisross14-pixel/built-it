import React from 'react'

// Minimal stroke icon set (24×24 grid).
const P = {
  back: 'M15 18l-6-6 6-6',
  chevron: 'M9 18l6-6-6-6',
  plan: 'M3 3h18v18H3zM3 9h18M9 21V9M15 9v12',
  cube: 'M12 2l9 5v10l-9 5-9-5V7zM12 22V12M21 7l-9 5-9-5',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3',
  redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3',
  brief: 'M9 3h6v3H9zM6 5H5a1 1 0 00-1 1v14a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h-1M8 11h8M8 15h5',
  check: 'M4 12l5 5L20 6',
  stamp: 'M5 21h14M6 17h12l-1-4H7zM9 13V9a3 3 0 116 0v4',
  select: 'M5 3l14 7-6 2-2 6z',
  room: 'M4 4h16v16H4zM4 4l4 4M20 4l-4 4M4 20l4-4M20 20l-4-4',
  door: 'M5 21V4h9v17M14 4l5 2v15M11 12h.01M3 21h18',
  window: 'M4 4h16v16H4zM12 4v16M4 12h16',
  sofa: 'M4 11V8a2 2 0 012-2h12a2 2 0 012 2v3M2 12a2 2 0 014 0v2h12v-2a2 2 0 014 0v5H2zM5 17v2M19 17v2',
  brush: 'M14 4l6 6-8 8H6v-6zM4 20l2-2',
  eraser: 'M7 21h11M4 15l9-9 7 7-6 6H8z',
  plus: 'M12 5v14M5 12h14',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  rotate: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
  x: 'M6 6l12 12M18 6L6 18',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
  dice: 'M4 4h16v16H4zM8.5 8.5h.01M15.5 15.5h.01M15.5 8.5h.01M8.5 15.5h.01M12 12h.01',
  trophy: 'M8 4h8v5a4 4 0 01-8 0zM8 6H4a3 3 0 003 4M16 6h4a3 3 0 01-3 4M12 13v4M8 21h8M9 17h6',
  building: 'M5 21V3h10v18M15 9h4v12M3 21h18M8 7h4M8 11h4M8 15h4',
  cards: 'M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM9 8h6M9 12h6',
  hat: 'M3 18h18M5 18a7 7 0 0114 0M12 8V5M9 9l-1-2M15 9l1-2',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 100-18 9 9 0 000 18z',
  sun: 'M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  coin: 'M12 21a9 9 0 100-18 9 9 0 000 18zM15 9.5a3 3 0 00-3-1.5c-1.7 0-3 .9-3 2s1.3 1.8 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 01-3-1.5M12 6v2M12 16v2',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  section: 'M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4',
  play: 'M7 4l13 8-13 8z',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  grid: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18',
  leaf: 'M5 19c0-9 6-14 15-14 0 9-5 15-14 15zM5 19l8-8',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z',
  moon: 'M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z',
}

export default function Icon({ name, size = 20, stroke = 1.8, className = '', fill = 'none' }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || P.info} />
    </svg>
  )
}
