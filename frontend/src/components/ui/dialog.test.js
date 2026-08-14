import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dialog, DialogContent } from './dialog';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <button>First</button>
          <button>Last</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const openDialog = async () => {
  render(<Harness />);
  fireEvent.click(screen.getByText('Open'));
  await waitFor(() => expect(screen.getByText('First')).toBeInTheDocument());
};

describe('Dialog accessibility', () => {
  it('renders nothing when closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has role="dialog" and aria-modal when open', async () => {
    await openDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('moves focus to the first focusable element on open', async () => {
    await openDialog();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText('First')));
  });

  it('Escape closes the dialog and restores focus to the trigger', async () => {
    render(<Harness />);
    const openBtn = screen.getByText('Open');
    openBtn.focus();
    fireEvent.click(openBtn);
    await waitFor(() => expect(screen.getByText('First')).toBeInTheDocument());

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.activeElement).toBe(openBtn);
  });

  it('backdrop click closes the dialog', async () => {
    await openDialog();
    fireEvent.click(screen.getByTestId('dialog-backdrop'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('Tab wraps from the last focusable element back to the first', async () => {
    await openDialog();
    screen.getByText('Last').focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('Shift+Tab wraps from the first focusable element to the last', async () => {
    await openDialog();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText('First')));
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('Last'));
  });
});
