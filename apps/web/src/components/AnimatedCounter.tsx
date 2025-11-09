import { useEffect, useMemo, useState } from 'react';

const scrambleChars = '0123456789█▒▓#@';

type AnimatedCounterProps = {
  value: number;
  duration?: number; // ms
  scrambleDuration?: number; // ms per cycle
  className?: string;
};

export default function AnimatedCounter({
  value,
  duration = 1200,
  scrambleDuration = 100,
  className,
}: AnimatedCounterProps) {
  const target = useMemo(() => value.toLocaleString(), [value]);
  const [display, setDisplay] = useState(() => target);
  const [scrambling, setScrambling] = useState(true);

  useEffect(() => {
    setScrambling(true);
    let frame = 0;
    const totalFrames = Math.ceil(duration / scrambleDuration);

    const interval = setInterval(() => {
      frame += 1;
      if (frame >= totalFrames) {
        setDisplay(target);
        setScrambling(false);
        clearInterval(interval);
      } else {
        const progress = frame / totalFrames;
        // progressively reveal digits
        const revealCount = Math.floor(progress * target.length);
        setDisplay(() =>
          target
            .split('')
            .map((char, index) => {
              if (!/[0-9]/.test(char)) return char;
              if (index < revealCount) return char;
              const random = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
              return random;
            })
            .join('')
        );
      }
    }, scrambleDuration);

    return () => clearInterval(interval);
  }, [target, duration, scrambleDuration]);

  return (
    <span className={className} style={{ letterSpacing: '0.05em' }}>
      {display}
      {scrambling && <span style={{ marginLeft: 4, opacity: 0.7 }}> calibrating...</span>}
    </span>
  );
}
