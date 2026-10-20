import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { I18nProvider } from '@/i18n/I18nProvider';

/** Renders a component inside the i18n provider, as the [locale] layout does. */
export function renderWithI18n(ui: ReactElement, locale: Locale = 'en') {
  return render(
    <I18nProvider locale={locale} dictionary={getDictionary(locale)}>
      {ui}
    </I18nProvider>,
  );
}
