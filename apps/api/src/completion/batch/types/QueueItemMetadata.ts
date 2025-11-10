export type QueueItem<T> = {
  payload: T;
  metadata: QueueItemMetadata;
};

export type QueueItemMetadata = {
  retryCount: number;
  createdAt: number;
};
