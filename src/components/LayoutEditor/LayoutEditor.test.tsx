import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { LayoutEditor } from '@/components/LayoutEditor/LayoutEditor';
import { useStickerStore } from '@/store/useStickerStore';
import { DEFAULT_LAYOUT } from '@/utils/render-sticker';

beforeEach(() => {
  useStickerStore.setState({ layout: { ...DEFAULT_LAYOUT } });
});

describe('LayoutEditor', () => {
  it('renders the panel header', () => {
    render(<LayoutEditor />);
    expect(screen.getByText(/layout/i)).toBeInTheDocument();
  });

  it('does not show "Modified" badge when layout matches default', () => {
    render(<LayoutEditor />);
    expect(screen.queryByText(/modified/i)).not.toBeInTheDocument();
  });

  it('shows "Modified" badge when a value differs from default', () => {
    useStickerStore.setState({ layout: { ...DEFAULT_LAYOUT, nameFontSize: 99 } });
    render(<LayoutEditor />);
    expect(screen.getByText(/modified/i)).toBeInTheDocument();
  });

  it('expands controls when header is clicked', async () => {
    render(<LayoutEditor />);
    const toggle = screen.getByRole('button', { name: /layout/i });
    await userEvent.click(toggle);
    // After expanding, input fields or slider for a known label should be visible
    expect(screen.getByText(/outer padding/i)).toBeInTheDocument();
  });

  it('Reset button restores default layout', async () => {
    useStickerStore.setState({ layout: { ...DEFAULT_LAYOUT, nameFontSize: 99 } });
    render(<LayoutEditor />);
    // Expand panel
    const toggle = screen.getByRole('button', { name: /layout/i });
    await userEvent.click(toggle);
    const resetBtn = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetBtn);
    expect(useStickerStore.getState().layout).toEqual(DEFAULT_LAYOUT);
  });
});
