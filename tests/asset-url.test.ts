import { describe, expect, it, vi } from 'vitest';
import {
  appBasePathFromLocation,
  sampleBaseUrlForSampleDir,
} from '../src/app/asset-url';

describe('appBasePathFromLocation', () => {
  it('keeps trailing slash paths', () => {
    expect(appBasePathFromLocation('/Guitar-Fletboard-Visualization/')).toBe(
      '/Guitar-Fletboard-Visualization/',
    );
  });

  it('adds slash when pathname has no trailing slash', () => {
    expect(appBasePathFromLocation('/Guitar-Fletboard-Visualization')).toBe(
      '/Guitar-Fletboard-Visualization/',
    );
  });

  it('normalizes index.html paths', () => {
    expect(
      appBasePathFromLocation('/Guitar-Fletboard-Visualization/index.html'),
    ).toBe('/Guitar-Fletboard-Visualization/');
  });
});

describe('sampleBaseUrlForSampleDir', () => {
  it('builds absolute sample URLs from location', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'https://example.github.io',
        pathname: '/Guitar-Fletboard-Visualization',
        href: 'https://example.github.io/Guitar-Fletboard-Visualization',
      },
    });
    try {
      expect(sampleBaseUrlForSampleDir('steel-guitar')).toBe(
        'https://example.github.io/Guitar-Fletboard-Visualization/samples/steel-guitar/',
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
