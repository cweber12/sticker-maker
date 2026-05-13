import { describe, it, expect } from 'vitest';
import { normalize, artNameFromFilename, matchImageToArtName } from '@/utils/fuzzy-match';

describe('normalize', () => {
  it('lowercases the string', () => {
    expect(normalize('Hello World')).toBe('hello world');
  });

  it('strips non-alphanumeric characters', () => {
    // Dashes and underscores are stripped as non-alphanumeric (not converted to spaces)
    expect(normalize('Art-Name_123!')).toBe('artname123');
  });

  it('collapses multiple spaces', () => {
    expect(normalize('art  name')).toBe('art name');
  });

  it('trims leading/trailing whitespace', () => {
    expect(normalize('  art name  ')).toBe('art name');
  });

  it('returns empty string for empty input', () => {
    expect(normalize('')).toBe('');
  });
});

describe('artNameFromFilename', () => {
  it('strips file extension', () => {
    expect(artNameFromFilename('roses.jpg')).toBe('roses');
  });

  it('strips _front suffix', () => {
    expect(artNameFromFilename('roses_front.jpg')).toBe('roses');
  });

  it('strips -back suffix', () => {
    expect(artNameFromFilename('roses-back.png')).toBe('roses');
  });

  it('strips trailing _1 numeric suffix', () => {
    expect(artNameFromFilename('sunset_1.jpg')).toBe('sunset');
  });

  it('converts underscores and hyphens to spaces', () => {
    expect(artNameFromFilename('art_name-test.jpg')).toBe('art name test');
  });
});

describe('matchImageToArtName', () => {
  const artNames = [
    { id: '1', artName: 'Roses in Bloom' },
    { id: '2', artName: 'Mountain Sunset' },
    { id: '3', artName: 'Ocean Waves' },
  ];

  it('returns id on exact normalized match', () => {
    expect(matchImageToArtName('roses_in_bloom.jpg', artNames)).toBe('1');
  });

  it('matches when filename contains art name', () => {
    expect(matchImageToArtName('mountain_sunset_front.jpg', artNames)).toBe('2');
  });

  it('is case-insensitive', () => {
    expect(matchImageToArtName('OCEAN_WAVES.png', artNames)).toBe('3');
  });

  it('returns null when no match is found', () => {
    expect(matchImageToArtName('completely_unrelated.jpg', artNames)).toBeNull();
  });

  it('returns null when match token is shorter than 3 chars', () => {
    expect(matchImageToArtName('ab.jpg', artNames)).toBeNull();
  });

  it('returns null for empty art names list', () => {
    expect(matchImageToArtName('roses.jpg', [])).toBeNull();
  });
});
