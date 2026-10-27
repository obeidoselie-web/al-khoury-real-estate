import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Dropdown } from '@/components/Dropdown';

const OPTIONS = [
  { value: 'all', label: 'Anywhere', count: 5 },
  { value: 'beirut', label: 'Beirut', count: 3 },
  { value: 'metn', label: 'Metn', count: 0 },
  { value: 'batroun', label: 'Batroun', count: 2 },
];

function Controlled({ onChange }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState('all');
  return (
    <>
      <Dropdown
        label="Region"
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange?.(v);
        }}
        options={OPTIONS}
        countLabel={(n) => `${n} properties`}
      />
      <button type="button">After</button>
    </>
  );
}

describe('Dropdown', () => {
  it('is a combobox that opens a listbox with the current choice selected', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const box = screen.getByRole('combobox', { name: 'Region' });
    expect(box).toHaveAttribute('aria-expanded', 'false');
    expect(box).toHaveTextContent('Anywhere');

    await user.click(box);
    expect(box).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: 'Region' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Anywhere/ })).toHaveAttribute('aria-selected', 'true');
    // Counts are announced in words, and empty options stay selectable.
    expect(screen.getByRole('option', { name: /Metn/ })).toHaveAccessibleName(/0 properties/);
  });

  it('works from the keyboard: arrows, Home/End, type-ahead, Enter and Escape', async () => {
    const user = userEvent.setup();
    const picked: string[] = [];
    render(<Controlled onChange={(v) => picked.push(v)} />);
    const box = screen.getByRole('combobox', { name: 'Region' });
    box.focus();

    await user.keyboard('{ArrowDown}'); // opens on the current choice
    expect(box).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(picked).toEqual(['beirut']);
    expect(box).toHaveTextContent('Beirut');
    expect(box).toHaveFocus();

    await user.keyboard('{Enter}{End}{Enter}');
    expect(picked.at(-1)).toBe('batroun');

    await user.keyboard('{ArrowDown}m{Enter}');
    expect(picked.at(-1)).toBe('metn');

    await user.keyboard('{ArrowDown}{Home}{Escape}');
    expect(box).toHaveAttribute('aria-expanded', 'false');
    expect(box).toHaveTextContent('Metn'); // Escape leaves the choice unchanged
  });

  it('points aria-activedescendant at the highlighted option', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const box = screen.getByRole('combobox', { name: 'Region' });
    box.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const active = document.getElementById(box.getAttribute('aria-activedescendant')!);
    expect(active).toHaveTextContent('Beirut');
  });

  it('closes on an outside click without changing the value', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole('combobox', { name: 'Region' }));
    await user.click(screen.getByRole('button', { name: 'After' }));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Region' })).toHaveTextContent('Anywhere');
  });

  it('submits its value with a form', async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="search">
        <Dropdown name="region" label="Where" defaultValue="all" options={OPTIONS} />
      </form>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Where' }));
    await user.click(screen.getByRole('option', { name: /Batroun/ }));
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('region')).toBe('batroun');
  });
});
