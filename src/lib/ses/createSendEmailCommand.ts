// SES disabled: return a plain object placeholder compatible with our sesClient stub
export const createSendEmailCommand = (_toAddress: string, _fromAddress: string, _subject: string, _body: string) =>
  ({}) as const;
