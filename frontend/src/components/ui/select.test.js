import { render, screen, fireEvent } from '@testing-library/react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';

function TestSelect({ value, onValueChange }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Alpha</SelectItem>
        <SelectItem value="b">Beta</SelectItem>
        <SelectItem value="c">Gamma</SelectItem>
      </SelectContent>
    </Select>
  );
}

describe('Select keyboard accessibility', () => {
  it('trigger is focusable, has combobox role, and starts closed', () => {
    render(<TestSelect />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('tabIndex', '0');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens on click and lists every option', () => {
    render(<TestSelect />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('ArrowDown opens the list and highlights the first option', () => {
    render(<TestSelect />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const first = screen.getByRole('option', { name: 'Alpha' });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(first.id);
  });

  it('ArrowUp opens the list highlighting the last option', () => {
    render(<TestSelect />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    const last = screen.getByRole('option', { name: 'Gamma' });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(last.id);
  });

  it('ArrowDown clamps at the last option instead of wrapping', () => {
    render(<TestSelect />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // highlight index 0
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // index 1
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // index 2 (last)
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // stays at 2
    const last = screen.getByRole('option', { name: 'Gamma' });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(last.id);
  });

  it('ArrowUp clamps at the first option instead of wrapping', () => {
    render(<TestSelect />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowUp' }); // opens, highlight last (2)
    fireEvent.keyDown(trigger, { key: 'ArrowUp' }); // 1
    fireEvent.keyDown(trigger, { key: 'ArrowUp' }); // 0
    fireEvent.keyDown(trigger, { key: 'ArrowUp' }); // stays at 0
    const first = screen.getByRole('option', { name: 'Alpha' });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(first.id);
  });

  it('Enter selects the highlighted option and closes the list', () => {
    const onValueChange = jest.fn();
    render(<TestSelect onValueChange={onValueChange} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // Alpha
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // Beta
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('clicking an option selects it directly', () => {
    const onValueChange = jest.fn();
    render(<TestSelect onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Gamma' }));
    expect(onValueChange).toHaveBeenCalledWith('c');
  });

  it('Escape closes the list and returns focus to the trigger', () => {
    render(<TestSelect />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab closes the list without selecting', () => {
    const onValueChange = jest.fn();
    render(<TestSelect onValueChange={onValueChange} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'Tab' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
