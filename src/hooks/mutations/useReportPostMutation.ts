'use client';

import { useMutation } from '@tanstack/react-query';
import { useErrorNotifier } from '../useErrorNotifier';

export function useReportPostMutation() {
  const { notifyError } = useErrorNotifier();

  const reportMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: number; reason: string }) => {
      const res = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw Error(body?.message ?? 'Failed to report post.');
      }
      return (await res.json()) as { message: string };
    },
    onError: (error) => notifyError(error),
  });

  return { reportMutation };
}
