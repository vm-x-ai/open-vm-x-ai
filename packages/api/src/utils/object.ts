export function replaceUndefinedWithNull<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value === undefined ? null : value,
    ])
  ) as T;
}
