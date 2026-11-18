import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function ConfettiLauncher({ trigger = true }) {
  useEffect(() => {
    if (!trigger) return;

    // First burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#f59e0b', '#38bdf8', '#10b981']
    });

    // Secondary burst after 300ms
    const timeout = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#8b5cf6', '#ec4899', '#fbbf24']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#38bdf8', '#a855f7', '#f43f5e']
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [trigger]);

  return null;
}
