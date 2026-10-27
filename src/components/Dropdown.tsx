'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import styles from './Dropdown.module.css';
import { CheckIcon, ChevronDownIcon } from './icons';

export interface DropdownOption<V extends string = string> {
  value: V;
  label: string;
  icon?: ReactNode;
  /** Matching properties; options with 0 are dimmed (still selectable). */
  count?: number;
}

interface DropdownProps<V extends string> {
  /** Accessible name, and the title of the phone sheet. */
  label: string;
  options: DropdownOption<V>[];
  /** Controlled use… */
  value?: V;
  onChange?: (value: V) => void;
  /** …or uncontrolled inside a form (submitted as `name`). */
  defaultValue?: V;
  name?: string;
  /** Icon at the start of the button. */
  icon?: ReactNode;
  /** Small caption above the value (the home search fields). */
  caption?: string;
  triggerClassName?: string;
  /** Class for the native <select> shown before JavaScript loads (form use only). */
  nativeClassName?: string;
  /** Which edge of the button the panel lines up with. */
  align?: 'start' | 'end';
  /** "{count} properties" for screen readers, when counts are shown. */
  countLabel?: (count: number) => string;
}

/**
 * A select-only combobox (WAI-ARIA APG pattern): focus stays on the button and the active option
 * is announced through aria-activedescendant. Keys: ↑/↓, Home/End, type-ahead, Enter/Space to
 * choose, Escape to close, Tab chooses and moves on. Opens as a panel under the button, or as a
 * bottom sheet on phones.
 */
export function Dropdown<V extends string>({
  label,
  options,
  value: controlled,
  onChange,
  defaultValue,
  name,
  icon,
  caption,
  triggerClassName,
  nativeClassName,
  align = 'start',
  countLabel,
}: DropdownProps<V>) {
  const id = useId();
  const listId = `${id}-list`;
  const [uncontrolled, setUncontrolled] = useState<V>(defaultValue ?? options[0].value);
  const value = controlled ?? uncontrolled;
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const [position, setPosition] = useState<CSSProperties>({});
  const [sheet, setSheet] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });

  useEffect(() => setMounted(true), []);

  const choose = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      if (controlled === undefined) setUncontrolled(option.value);
      if (option.value !== value) onChange?.(option.value);
      setOpen(false);
    },
    [options, controlled, value, onChange],
  );

  /**
   * The panel lives in a portal (so no scrolling row or animated parent can clip it) and is placed
   * from the button's position: under it, or above when there's no room; aligned to the button's
   * start or end edge in either text direction. Phones get a bottom sheet instead.
   */
  const place = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const isSheet = window.matchMedia?.('(max-width: 559px)').matches ?? false;
    setSheet(isSheet);
    if (isSheet) return setPosition({});
    const rect = button.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const rtl = getComputedStyle(button).direction === 'rtl';
    const fromLeft = (align === 'start') !== rtl;
    const above = vh - rect.bottom < 320 && rect.top > vh - rect.bottom;
    setPosition({
      position: 'fixed',
      minWidth: Math.max(rect.width, 240),
      ...(fromLeft ? { left: Math.max(8, rect.left) } : { right: Math.max(8, vw - rect.right) }),
      ...(above ? { bottom: vh - rect.top + 8 } : { top: rect.bottom + 8 }),
      transformOrigin: above ? 'bottom' : 'top',
    });
  }, [align]);

  const openList = () => {
    setActive(selectedIndex);
    place();
    setOpen(true);
  };

  // Follow the button while the page scrolls or resizes.
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  // Close on a click or tap outside.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  // Keep the active option in view.
  useLayoutEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    const move = (index: number) => {
      event.preventDefault();
      if (!open) openList();
      setActive(Math.min(last, Math.max(0, index)));
    };
    switch (event.key) {
      case 'ArrowDown':
        return open ? move(active + 1) : move(selectedIndex);
      case 'ArrowUp':
        return open ? move(active - 1) : move(selectedIndex);
      case 'Home':
        return move(0);
      case 'End':
        return move(last);
      case 'PageDown':
        return move(active + 10);
      case 'PageUp':
        return move(active - 10);
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) choose(active);
        else openList();
        return;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        return;
      case 'Tab':
        if (open) choose(active);
        return;
      default:
        // Type-ahead: jump to the first option starting with what was typed.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const now = Date.now();
          typed.current = { text: (now - typed.current.at > 700 ? '' : typed.current.text) + event.key.toLowerCase(), at: now };
          const match = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
          if (match >= 0) move(match);
        }
    }
  };

  // Before hydration, a form field stays usable as a plain select.
  if (!mounted && name) {
    return (
      <select name={name} defaultValue={value} className={nativeClassName} aria-label={label}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div ref={wrapRef} className={styles.wrap} data-open={open || undefined}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        className={`${styles.trigger} ${triggerClassName ?? ''}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        {icon && <span className={styles.leading}>{icon}</span>}
        <span className={styles.value}>
          {caption && <span className={styles.caption}>{caption}</span>}
          <span className={styles.valueText}>{selected.label}</span>
        </span>
        <ChevronDownIcon size={16} className={styles.chevron} />
      </button>

      {open &&
        createPortal(
          <>
            {sheet && <div className={styles.backdrop} aria-hidden="true" onPointerDown={() => setOpen(false)} />}
            <div ref={panelRef} className={styles.panel} data-sheet={sheet || undefined} style={position} dir={buttonRef.current ? getComputedStyle(buttonRef.current).direction : undefined}>
        <p className={styles.sheetTitle} aria-hidden="true">
          {label}
        </p>
        <ul ref={listRef} id={listId} role="listbox" aria-label={label} className={styles.list} tabIndex={-1}>
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                data-index={index}
                data-active={index === active || undefined}
                data-empty={option.count === 0 || undefined}
                className={styles.option}
                // Keep focus on the button so keyboard and screen-reader context is not lost.
                onPointerDown={(e) => e.preventDefault()}
                onPointerEnter={() => setActive(index)}
                onClick={() => {
                  choose(index);
                  buttonRef.current?.focus();
                }}
              >
                {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
                <span className={styles.optionLabel}>{option.label}</span>
                {option.count !== undefined && (
                  <span className={styles.count}>
                    <span aria-hidden="true">{option.count}</span>
                    {countLabel && <span className="sr-only">, {countLabel(option.count)}</span>}
                  </span>
                )}
                <span className={styles.check} aria-hidden="true">
                  {isSelected && <CheckIcon size={16} />}
                </span>
              </li>
            );
          })}
        </ul>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
