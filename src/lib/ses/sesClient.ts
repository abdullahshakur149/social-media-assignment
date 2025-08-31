import 'server-only';

// SES disabled: provide a stub client to satisfy imports
export const sesClient = {
  send: async () => Promise.resolve(undefined),
} as const;
