import 'server-only';

// SES disabled: provide a stub client to satisfy imports
export const sesClient = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  send: async (_command: unknown) => Promise.resolve(undefined),
} as const;
