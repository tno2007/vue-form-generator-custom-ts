/**
 * Gets the value at `path` of `object`.
 * @param object
 * @param path
 * @param defaultVal
 * * // https://gist.github.com/harish2704/d0ee530e6ee75bad6fd30c98e5ad9dab
 */
export function getProp(object: any, path: any, defaultVal: any): any {
  const PATH = Array.isArray(path)
    ? path
    : path.split(".").filter((i: string | any[]) => i.length);
  if (!PATH.length) {
    return object === undefined ? defaultVal : object;
  }
  if (
    object === null ||
    object === undefined ||
    typeof object[PATH[0]] === "undefined"
  ) {
    return defaultVal;
  }
  return getProp(object[PATH.shift()], PATH, defaultVal);
}

export function isFunction(fn: any) {
  if (typeof fn === "function") {
    return true;
  }
  return false;
}

export function isNil(value: any) {
  return value === null || value === undefined;
}

export function isArray(object: any) {
  if (!object) return false;
  return object.constructor === Array;
}

export function isString(object: any) {
  return Object.prototype.toString.call(object) === "[object String]";
}

export function forEach(object: Array<any>) {
  if (isNil(object)) return;
  if (!isArray(object)) return;
  return object.forEach;
}
