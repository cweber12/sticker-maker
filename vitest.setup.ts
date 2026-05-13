import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Canvas stub
// jsdom does not implement HTMLCanvasElement. Stub out enough of the 2D
// context API for render-sticker tests to run without errors.
// ---------------------------------------------------------------------------
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle = '';
  letterSpacing = '';
  font = '';
  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; }
  fillRect = vi.fn();
  drawImage = vi.fn();
  fillText = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  getImageData = vi.fn(() => ({ data: new Uint8ClampedArray(4) }));
  putImageData = vi.fn();
  clearRect = vi.fn();
  save = vi.fn();
  restore = vi.fn();
  scale = vi.fn();
  translate = vi.fn();
  beginPath = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  fill = vi.fn();
  rect = vi.fn();
}

HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string) {
  if (type === '2d') return new MockCanvasRenderingContext2D(this) as unknown as CanvasRenderingContext2D;
  return null;
} as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,fake');

// ---------------------------------------------------------------------------
// bwip-js stub
// ---------------------------------------------------------------------------
vi.mock('bwip-js', () => ({
  default: {
    toCanvas: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// URL helpers stub (jsdom supports createObjectURL but not revokeObjectURL)
// ---------------------------------------------------------------------------
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:fake-url');
}
URL.revokeObjectURL = vi.fn();

// ---------------------------------------------------------------------------
// import.meta.env stub for pdf-fonts.ts
// ---------------------------------------------------------------------------
// Vitest sets import.meta.env.BASE_URL automatically via vite; this is just
// a safety net in case the module is imported outside of a Vite context.
if (!import.meta.env.BASE_URL) {
  Object.defineProperty(import.meta.env, 'BASE_URL', { value: '/' });
}
