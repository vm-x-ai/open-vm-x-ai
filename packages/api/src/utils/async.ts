// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAsyncIterable<T>(obj: any): obj is AsyncIterable<T> {
  return obj != null && typeof obj[Symbol.asyncIterator] === 'function';
}
