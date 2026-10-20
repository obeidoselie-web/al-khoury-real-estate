import type { TypeFilter } from '@/lib/filters';

import styles from './CategoryTabs.module.css';
import type { ChoiceOption } from './ChoiceGroup';
import { PROPERTY_TYPE_ICONS } from './icons';

interface CategoryTabsProps {
  name: string;
  legend: string;
  options: ChoiceOption<TypeFilter>[];
  value: TypeFilter;
  onChange: (value: TypeFilter) => void;
}

/**
 * Property-type filter as a category bar: outlined icon above a label, a 2px underline on the
 * active tab. Built on native radio buttons, so it is one Tab stop with arrow-key navigation and
 * announces "radio button, 2 of 5, checked". Scrolls horizontally on narrow screens.
 */
export function CategoryTabs({ name, legend, options, value, onChange }: CategoryTabsProps) {
  return (
    <fieldset className={styles.group}>
      <legend className="sr-only">{legend}</legend>
      <div className={styles.tabs}>
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const Icon = PROPERTY_TYPE_ICONS[option.value];
          return (
            <label key={option.value} htmlFor={id} className={styles.option} data-empty={option.count === 0 || undefined}>
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className={styles.input}
              />
              <span className={styles.tab}>
                <Icon size={24} />
                <span className={styles.label}>
                  {option.label}
                  {option.countLabel && <span className="sr-only">, {option.countLabel}</span>}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
