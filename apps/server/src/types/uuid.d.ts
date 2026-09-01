declare module 'uuid' {
  export function v4(options?: { random?: number[] }): string;
  export const v4: (options?: { random?: number[] }) => string;
}
