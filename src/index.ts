import { convertPathToArrayOfKeys } from './convert-path-to-array-of-keys';
import { getValueFromObjWithPath, GetValueOptions, syncGetValueFromObjWithPath } from './get-value-from-obj-with-path';

type PathResolver = (value: any, path: string) => any;

export interface PathResolverOptions extends GetValueOptions {
  sync?: boolean;
}

const defaultOptions: PathResolverOptions = {
  missing: undefined,
  sync: false,
};

// We do not support empty strings as keys
// also special characters need to be escaped if wanted to use as plain actual key characters ('\', '.', '*')
export function pathResolver<Options extends PathResolverOptions = PathResolverOptions>(
  obj: any,
  path: string,
  options: Options = defaultOptions as Options,
): Options['sync'] extends true ? any : Promise<any> {
  const parsedPath = convertPathToArrayOfKeys(path);

  if (options.sync) {
    return syncGetValueFromObjWithPath(obj, parsedPath, options);
  }

  return getValueFromObjWithPath(obj, parsedPath, options);
}

export function createPathResolver<Options extends PathResolverOptions = PathResolverOptions>(
  options: Options = defaultOptions as Options,
): PathResolver {
  return (value, path) => pathResolver(value, path, options);
}
