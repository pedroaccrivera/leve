import React, { useEffect, useRef, useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import { useHue } from '../../context/HueContext';
import { cx } from '../../utils/cx';

/** Full hue wheel, matching the spectrum the marker travels along. */
const SPECTRUM =
  'linear-gradient(to right, hsl(0 85% 55%), hsl(60 85% 55%), hsl(120 85% 55%), hsl(180 85% 55%), hsl(240 85% 55%), hsl(300 85% 55%), hsl(360 85% 55%))';

/**
 * App tone control, inline in the header (design: "an expanded button, not a
 * separate settings panel").
 *
 * Collapsed: nothing but the theme switch. Hovering the group reveals a
 * palette button to its left; clicking it expands the same slot into a
 * 262 × 42 spectrum with a precision marker and the hue value. Moving the
 * slider rotates every colour in the app; hovering the value swaps it for a
 * reset that returns to the designed tone. The choice is saved on change.
 */
export const HueControl: React.FC<{ className?: string }> = ({ className }) => {
  const { hue, setHue, resetHue, isDefault } = useHue();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const percent = (hue / 360) * 100;

  return (
    <div ref={rootRef} className={cx('flex items-center gap-2', className)}>
      {/* Palette trigger — revealed by hovering the theme switch beside it. */}
      <div
        className={cx(
          'overflow-hidden transition-[width] duration-200 ease-fieldwork',
          open ? 'w-0' : 'w-0 group-hover:w-11'
        )}
        aria-hidden={open}
      >
        <button
          type="button"
          tabIndex={open ? -1 : 0}
          onClick={() => setOpen(true)}
          aria-label="Choose app tone"
          title="Choose app tone"
          className="flex h-11 w-11 items-center justify-center rounded-md border border-signal bg-[color-mix(in_oklab,var(--c-signal)_50%,transparent)] text-signal-text transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--c-signal)_62%,transparent)]"
        >
          <Palette className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Expanded spectrum. */}
      <div
        className={cx(
          'overflow-hidden transition-[width] duration-200 ease-fieldwork',
          open ? 'w-[262px]' : 'w-0'
        )}
        aria-hidden={!open}
      >
        <div className="flex h-11 w-[262px] items-center gap-2 rounded-md border border-signal-edge bg-signal-soft px-3">
          <div className="relative flex-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
            <div
              className="relative mx-[5px] h-3.5 rounded-lg"
              style={{ background: SPECTRUM }}
            >
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={hue}
                aria-label="App tone"
                onChange={(event) => setHue(Number(event.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
              />
              <span
                className="pointer-events-none absolute top-1/2 flex h-[22px] w-[10px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] border border-ink bg-paper"
                style={{ left: `${percent}%` }}
              >
                <span className="h-3 w-[2px] bg-ink" />
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={resetHue}
            aria-label={isDefault ? `App tone ${hue} degrees` : `Reset app tone to ${66} degrees`}
            title="Reset to the original tone"
            className="group/reset flex h-6 w-[34px] shrink-0 items-center justify-end text-ink"
          >
            <span className="t-mono group-hover/reset:hidden group-focus-visible/reset:hidden">
              {hue}°
            </span>
            <RotateCcw
              className="hidden h-4 w-4 group-hover/reset:block group-focus-visible/reset:block"
              strokeWidth={2}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
