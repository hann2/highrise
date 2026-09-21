export function objectKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

export function objectEntries<T extends object>(
  obj: T,
): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

export function objectMap<T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U,
): Record<keyof T, U> {
  return objectKeys(obj).reduce(
    (acc, key) => {
      acc[key] = fn(obj[key], key);
      return acc;
    },
    {} as Record<keyof T, U>,
  );
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>,
  );
}

export function grouped<T, K extends string = string>(
  arr: ReadonlyArray<T>,
  getKey: (item: T) => K,
): [K, T[]][] {
  return objectEntries(
    arr.reduce(
      (acc, item) => {
        const key = getKey(item);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      },
      {} as Record<K, T[]>,
    ),
  );
}
