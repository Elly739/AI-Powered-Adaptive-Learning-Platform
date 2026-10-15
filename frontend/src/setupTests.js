import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock resizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {
    this.disconnect = vi.fn();
    this.observe = vi.fn();
    this.unobserve = vi.fn();
  }
};

// Mock matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
};