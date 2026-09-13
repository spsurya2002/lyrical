import { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * The mobile meaning sheet (FR-031).
 *
 * Rises from the bottom and never covers the lyric entirely — at its tallest it
 * stops at 80% of the viewport. Most people hear a song and reach for their
 * phone, so this is the majority reading experience, not a fallback: burying
 * the song to show its explanation would defeat the point of both.
 *
 * Two heights rather than free dragging: half, for a glance at the line, and
 * tall, for reading it properly. A continuously draggable sheet is more to
 * build and gives the reader a decision they did not ask for.
 */
export function MeaningSheet({ open, onClose, children }: Props) {
  const [tall, setTall] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) setTall(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onDragEnd = (endY: number) => {
    const startY = dragStartY.current;
    dragStartY.current = null;
    if (startY === null) return;
    const travelled = endY - startY;
    // Down far enough closes; up far enough grows. Small movements are scroll
    // attempts, not gestures, and must not move the sheet.
    if (travelled > 60) {
      if (tall) setTall(false);
      else onClose();
    } else if (travelled < -60) {
      setTall(true);
    }
  };

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-label="Meaning"
      data-testid="meaning-sheet"
      data-height={tall ? 'tall' : 'half'}
      className={[
        'fixed inset-x-0 bottom-0 z-40 lg:hidden',
        'rounded-t-lg border-t border-border-default bg-elevated shadow-float',
        'flex flex-col transition-[max-height] duration-200',
        // Never full height: part of the lyric always stays visible.
        tall ? 'max-h-[80vh]' : 'max-h-[50vh]',
      ].join(' ')}
      onTouchStart={(event) => {
        dragStartY.current = event.touches[0]?.clientY ?? null;
      }}
      onTouchEnd={(event) => {
        onDragEnd(event.changedTouches[0]?.clientY ?? 0);
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <button
          type="button"
          aria-label={tall ? 'Shrink' : 'Expand'}
          data-testid="sheet-grabber"
          onClick={() => setTall(!tall)}
          className="mx-auto h-6 w-16 rounded-full py-2"
        >
          <span className="block h-1 w-10 rounded-full bg-border-strong mx-auto" />
        </button>
        <button
          type="button"
          aria-label="Close"
          data-testid="sheet-close"
          onClick={onClose}
          className="absolute right-3 top-2 rounded-md px-3 py-2 text-sm text-muted hover:text-primary"
        >
          Close
        </button>
      </div>

      <div className="overflow-y-auto px-4 pb-8 pt-2">{children}</div>
    </div>
  );
}
