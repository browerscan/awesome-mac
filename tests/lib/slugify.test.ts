import { describe, it, expect } from 'vitest';
import { slugify, generateId } from '@/lib/slugify';

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('HELLO')).toBe('hello');
    expect(slugify('HeLLo WoRLd')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
    expect(slugify('foo bar baz')).toBe('foo-bar-baz');
  });

  it('should remove special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld');
    expect(slugify('test@example.com')).toBe('testexamplecom');
  });

  it('should replace multiple hyphens with single hyphen', () => {
    expect(slugify('hello---world')).toBe('hello-world');
    expect(slugify('foo   bar')).toBe('foo-bar');
  });

  it('should remove leading hyphens', () => {
    expect(slugify('-hello')).toBe('hello');
    expect(slugify('---hello')).toBe('hello');
  });

  it('should remove trailing hyphens', () => {
    expect(slugify('hello-')).toBe('hello');
    expect(slugify('hello---')).toBe('hello');
  });

  it('should handle underscores', () => {
    expect(slugify('hello_world')).toBe('hello-world');
    expect(slugify('hello_world_test')).toBe('hello-world-test');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle strings with only special characters', () => {
    expect(slugify('@#$!')).toBe('');
  });

  it('should preserve numbers', () => {
    expect(slugify('app123')).toBe('app123');
    expect(slugify('version 2.0')).toBe('version-20');
  });

  it('should handle unicode characters', () => {
    expect(slugify('cafe')).toBe('cafe');
    expect(slugify('hello world')).toBe('hello-world');
  });
});

describe('generateId', () => {
  it('should generate an id from text', () => {
    expect(generateId('Hello World')).toBe('hello-world');
  });

  it('should add prefix when provided', () => {
    expect(generateId('Hello World', 'prefix')).toBe('prefix-hello-world');
  });

  it('should slugify the text part', () => {
    expect(generateId('Foo Bar', 'test')).toBe('test-foo-bar');
  });

  it('should handle empty text', () => {
    expect(generateId('')).toBe('');
  });

  it('should handle empty prefix', () => {
    expect(generateId('Hello World', '')).toBe('hello-world');
  });

  it('should handle multiple levels of prefixes', () => {
    expect(generateId('App', 'cat-subcat')).toBe('cat-subcat-app');
  });
});
