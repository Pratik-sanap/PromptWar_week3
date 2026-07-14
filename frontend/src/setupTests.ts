import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically cleanup DOM elements after each test
afterEach(() => {
  cleanup();
});
