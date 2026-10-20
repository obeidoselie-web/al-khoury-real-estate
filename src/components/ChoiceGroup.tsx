import styles from './ChoiceGroup.module.css';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** Visible count badge, e.g. results per filter option. */
  count?: number;
  /** Screen-reader text for the count, already localised (", 3 listings"). */
  countLabel?: string;
  /** Language of the label when it differs from the page (e.g. "العربية" on an English page). */
  lang?: string;
}

interface ChoiceGroupProps<T extends string> {
  name: string;
  legend: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A single-choice group rendered as native radio buttons styled as pills:
 * one Tab stop per group, arrow keys move between options, and screen readers
 * announce "radio button, 2 of 5, checked" for free. Used for listing filters and settings.
 */
export function ChoiceGroup<T extends string>({ name, legend, options, value, onChange }: ChoiceGroupProps<T>) {
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
              <span className={styles.pill} lang={option.lang}>
                {option.label}
                {option.count !== undefined && (
                  <>
                    <span className={styles.count} aria-hidden="true">
                      {option.count}
                    </span>
                    {option.countLabel && <span className="sr-only">, {option.countLabel}</span>}
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
