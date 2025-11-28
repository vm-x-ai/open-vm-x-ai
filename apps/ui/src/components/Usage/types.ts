export type MetricType = 'bigint' | 'double';

export enum MetricFormat {
  NUMBER = 'NUMBER',
  BYTES = 'BYTES',
  MILLISECONDS = 'MILLISECONDS',
}

export type MetricDefinition = {
  name: string;
  type: MetricType;
  format: MetricFormat;
};
