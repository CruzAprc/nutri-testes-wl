import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import styles from './FullscreenPhotoViewer.module.css';

interface FullscreenPhotoViewerProps {
  isOpen: boolean;
  photoUrl: string | null;
  onClose: () => void;
}

function getDistance(t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function FullscreenPhotoViewer({
  isOpen,
  photoUrl,
  onClose,
}: FullscreenPhotoViewerProps) {
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Pinch state
  const initialPinchDistRef = useRef(0);
  const initialScaleRef = useRef(1);

  // Pan state
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  // Double-tap state
  const lastTapRef = useRef(0);

  const applyTransform = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const s = scaleRef.current;
    const { x, y } = translateRef.current;
    img.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  }, []);

  const resetTransform = useCallback(() => {
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
    applyTransform();
  }, [applyTransform]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset when closed or photo changes
  useEffect(() => {
    if (!isOpen) resetTransform();
  }, [isOpen, photoUrl, resetTransform]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 2) {
        // Start pinch
        isPanningRef.current = false;
        initialPinchDistRef.current = getDistance(touches[0], touches[1]);
        initialScaleRef.current = scaleRef.current;
      } else if (touches.length === 1) {
        // Check for double tap
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          // Double tap: toggle 1x / 2x
          if (scaleRef.current > 1) {
            scaleRef.current = 1;
            translateRef.current = { x: 0, y: 0 };
          } else {
            scaleRef.current = 2;
            translateRef.current = { x: 0, y: 0 };
          }
          applyTransform();
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;

        // Start pan (only effective when zoomed)
        lastTouchRef.current = {
          x: touches[0].clientX,
          y: touches[0].clientY,
        };
        isPanningRef.current = true;
      }
    },
    [applyTransform]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 2) {
        // Pinch zoom
        const dist = getDistance(touches[0], touches[1]);
        const ratio = dist / initialPinchDistRef.current;
        let newScale = initialScaleRef.current * ratio;
        newScale = Math.min(4, Math.max(1, newScale));
        scaleRef.current = newScale;

        // Reset translate if back to 1x
        if (newScale <= 1) {
          translateRef.current = { x: 0, y: 0 };
        }

        applyTransform();
      } else if (touches.length === 1 && isPanningRef.current && scaleRef.current > 1) {
        // Pan when zoomed
        const dx = touches[0].clientX - lastTouchRef.current.x;
        const dy = touches[0].clientY - lastTouchRef.current.y;

        translateRef.current = {
          x: translateRef.current.x + dx,
          y: translateRef.current.y + dy,
        };

        lastTouchRef.current = {
          x: touches[0].clientX,
          y: touches[0].clientY,
        };

        applyTransform();
      }
    },
    [applyTransform]
  );

  const handleTouchEnd = useCallback(() => {
    isPanningRef.current = false;

    // Snap back to 1x if close
    if (scaleRef.current < 1.1) {
      scaleRef.current = 1;
      translateRef.current = { x: 0, y: 0 };
      applyTransform();
    }
  }, [applyTransform]);

  if (!isOpen || !photoUrl) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeButton} onClick={onClose}>
        <X size={22} />
      </button>
      <div
        className={styles.imageContainer}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imgRef}
          src={photoUrl}
          alt="Progress photo fullscreen"
          className={styles.image}
          draggable={false}
        />
      </div>
    </div>
  );
}
