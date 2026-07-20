// Small set of clean line/solid SVG icons used across the app in place of emoji,
// so stat cards and headers render as crisp graphics rather than OS emoji art.
// Each icon inherits the current text color via `currentColor`.

const PATHS = {
  // Musical note
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  // Open book (lines reviewed)
  book: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
    </>
  ),
  // Star (words saved)
  star: (
    <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
  ),
  // Globe (language)
  globe: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19" />
      <path d="M12 2.5c2.6 2.6 4 6 4 9.5s-1.4 6.9-4 9.5c-2.6-2.6-4-6-4-9.5s1.4-6.9 4-9.5z" />
    </>
  ),
  // Target / bullseye (quiz / goal)
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  // Trophy (lesson complete)
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M9 18h6M10 14v4M14 14v4M8 21h8" />
    </>
  ),
  // Flame (streak)
  flame: (
    <path d="M12 2c1 3.5-2 4.5-2 7.5A2 2 0 0 0 12 12c1.5 0 2-1 2-1 1.5 1.5 3 3.4 3 6a5 5 0 0 1-10 0c0-3 2-4.5 3-6 .8-1.2 1.5-2 2-3z" />
  ),
  // Check (goal met)
  check: (
    <path d="M4 12.5l5 5 11-11" />
  ),
  // Speaker with sound waves (pronounce)
  volume: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8 8 0 0 1 0 12" />
    </>
  ),
}

function Icon({ name, size = 22, className = '', strokeWidth = 1.8, fill = false }) {
  const paths = PATHS[name]
  if (!paths) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  )
}

export default Icon
