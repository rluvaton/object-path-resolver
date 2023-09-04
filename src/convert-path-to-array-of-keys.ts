import { LRUCache } from 'lru-cache';

export const kAllItems = Symbol('kAllItems');
export type Path = (string | typeof kAllItems)[];

const SPECIAL_CHARS = new Set(['.', '*', '\\']);

const cache = new LRUCache<string, Path>({
  max: 1000,
});

export function convertPathToArrayOfKeys(path: string): Path {
  const pathFromCache = cache.get(path);
  if (pathFromCache) {
    return pathFromCache;
  }

  const keys: Path = [];
  const chars = path.split('');

  let currentKey = '';

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const nextChar = chars[i + 1];

    if (char === '\\') {
      // `char` is the last char, then ignore
      if (nextChar === undefined) {
        continue;
      }

      if (SPECIAL_CHARS.has(nextChar)) {
        currentKey += nextChar;

        // Skip the next char as we did it already
        i++;
        continue;
      }

      // Ignore it, if we want to use the backslash, we should escape that
      // (tried to escape a character that does not need escaping)
      continue;
    }

    if (char === '.') {
      if (currentKey === 'prototype' || currentKey === '__proto__') {
        throw new Error('using prototype or __proto__ is not allowed');
      }

      keys.push(currentKey);
      currentKey = '';
      continue;
    }

    if (char === '*') {
      keys.push(kAllItems);
      if (currentKey !== '') {
        console.warn("Path Resolver - must either put '.' (dot) BEFORE '*' or escape that with '\\' (backslash)", {
          path,
        });
      }
      if (nextChar !== undefined && nextChar !== '.') {
        console.warn("Path Resolver - must either put '.' (dot) AFTER '*' or escape that with '\\' (backslash)", {
          path,
        });
      }

      // skipping the next char as it's the '.'
      i++;
      continue;
    }

    currentKey += char;
  }

  if (currentKey !== '') {
    keys.push(currentKey);
  }

  cache.set(path, keys);

  return keys;
}

export function cleanCache__testOnly() {
  if (process.env.NODE_ENV !== 'test') {
    console.error('cleanCache__testOnly should only be called in test environment');
    throw new Error('cleanCache__testOnly should only be called in test environment');
  }
  cache.clear();
}
