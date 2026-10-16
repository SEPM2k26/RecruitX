export default function Thumbtack({ color = '#ff4d4d', className = '' }) {
  return (
    <div
      className={`thumbtack ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}
