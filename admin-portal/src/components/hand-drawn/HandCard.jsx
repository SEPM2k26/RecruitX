import Tape from './Tape';
import Thumbtack from './Thumbtack';

export default function HandCard({
  children,
  decoration = 'none', // 'none' | 'tape' | 'tack' | 'tape-left'
  variant = 'paper',   // 'paper' | 'postit' | 'muted'
  rotation = 0,        // degrees, e.g. -1, 1, 0.5
  className = '',
  onClick,
  style = {},
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'postit':
        return 'card-postit bg-postit text-pencil';
      case 'muted':
        return 'bg-paper-dark text-pencil';
      default:
        return 'bg-paper-white text-pencil';
    }
  };

  const dynamicStyle = {
    ...style,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
  };

  return (
    <div
      onClick={onClick}
      style={dynamicStyle}
      className={`card ${getVariantClass()} ${className}`}
    >
      {decoration === 'tape' && <Tape />}
      {decoration === 'tape-left' && <Tape position="left" />}
      {decoration === 'tack' && <Thumbtack />}
      {children}
    </div>
  );
}
