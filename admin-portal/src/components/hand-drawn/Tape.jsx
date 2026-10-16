export default function Tape({ position = 'top', className = '' }) {
  if (position === 'left') {
    return <div className={`tape-strip-left ${className}`} aria-hidden="true" />;
  }
  return <div className={`tape-strip ${className}`} aria-hidden="true" />;
}
