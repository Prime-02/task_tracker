export default function Avatar({ name, color, size = 36 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color || '#6366f1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 600,
      color: 'white',
      flexShrink: 0,
      letterSpacing: '-0.5px',
      userSelect: 'none',
    }}>
      {initials}
    </div>
  )
}
