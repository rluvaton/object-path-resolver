import { kAllItems, Path } from './convert-path-to-array-of-keys';

export interface GetValueOptions {
  // What we be return when value is missing
  missing?: any;
}

export async function getValueFromObjWithPath(obj: any, keys: Path, options: GetValueOptions): Promise<any> {
  let currentObj = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    // If not the last key, and we faced undefined / null than exit as missing
    if (currentObj == undefined && i !== keys.length - 1) {
      return options.missing;
    }

    if (key === kAllItems) {
      if (Array.isArray(currentObj)) {
        const leftKeys = keys.slice(i + 1);
        return Promise.all(currentObj.map((item) => getValueFromObjWithPath(item, leftKeys, options)));
      }

      // Support iterators
      if (typeof currentObj[Symbol.iterator] === 'function') {
        const leftKeys = keys.slice(i + 1);
        return Promise.all(Array.from(currentObj).map((item) => getValueFromObjWithPath(item, leftKeys, options)));
      }

      return options.missing;
    }

    if (typeof currentObj !== 'object' || currentObj === null || !(key in currentObj)) {
      return options.missing;
    }

    // This does not support indexes in iterators...
    currentObj = currentObj[key];

    if (typeof currentObj === 'function') {
      currentObj = await currentObj();
    }
  }

  return currentObj;
}

export function syncGetValueFromObjWithPath(obj: any, keys: Path, options: GetValueOptions): any {
  let currentObj = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    // If not the last key, and we faced undefined / null than exit as missing
    if (currentObj == undefined && i !== keys.length - 1) {
      return options.missing;
    }

    if (key === kAllItems) {
      if (Array.isArray(currentObj)) {
        const leftKeys = keys.slice(i + 1);
        return currentObj.map((item) => syncGetValueFromObjWithPath(item, leftKeys, options));
      }

      // Support iterators
      if (typeof currentObj[Symbol.iterator] === 'function') {
        const leftKeys = keys.slice(i + 1);
        return Array.from(currentObj).map((item) => syncGetValueFromObjWithPath(item, leftKeys, options));
      }

      return options.missing;
    }

    if (typeof currentObj !== 'object' || currentObj === null || !(key in currentObj)) {
      return options.missing;
    }

    // This does not support indexes in iterators...
    currentObj = currentObj[key];

    if (typeof currentObj === 'function') {
      currentObj = currentObj();
    }
  }

  return currentObj;
}
