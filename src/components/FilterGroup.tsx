import styles from './FilterGroup.module.css';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterGroupProps<T extends string> {
  name: string;
  legend: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A single-choice group rendered as native radio buttons styled as pills:
 * one Tab stop per group, arrow keys move between options, and screen readers
 * announce "radio button, 2 of 5, checked" for free.
 */
export function FilterGroup<T extends string>({ name, legend, options, value, onChange }: FilterGroupProps<T>) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          return (
            <label key={option.value} htmlFor={id} className={styles.option}>
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className={styles.input}
              />
              <span className={styles.pill}>
                {option.label}
                {option.count !== undefined && (
                  <>
                    <span className={styles.count} aria-hidden="true">
                      {option.count}
                    </span>
                    <span className="sr-only">
                      , {option.count} {option.count === 1 ? 'listing' : 'listings'}
                    </span>
                  </>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
