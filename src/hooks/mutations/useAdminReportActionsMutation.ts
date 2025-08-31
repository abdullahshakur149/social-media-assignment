'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useErrorNotifier } from '../useErrorNotifier';
import { useToast } from '../useToast';

export function useAdminReportActionsMutation() {
  const queryClient = useQueryClient();
  const { notifyError } = useErrorNotifier();
  const { showToast } = useToast();

  const actionMutation = useMutation({
    mutationFn: async ({
      reportId,
      action,
      adminNotes,
    }: {
      reportId: number;
      action: 'dismiss' | 'block_post' | 'review';
      adminNotes?: string;
    }) => {
      // eslint-disable-next-line no-console
      console.log('Making API call to:', `/api/admin/reports/${reportId}`, { action, adminNotes });

      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNotes }),
      });

      // eslint-disable-next-line no-console
      console.log('API response status:', res.status);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // eslint-disable-next-line no-console
        console.error('API error:', body);
        throw Error(body?.message ?? 'Failed to process report');
      }

      const result = await res.json();
      // eslint-disable-next-line no-console
      console.log('API success:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      const actionText = variables.action === 'block_post' ? 'blocked' : variables.action;
      showToast({
        title: 'Success',
        message: `Report ${actionText} successfully`,
        type: 'success',
      });

      // Invalidate and refetch reports
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });

      // If post was blocked, also invalidate posts queries
      if (variables.action === 'block_post') {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    },
    onError: (error) => {
      notifyError(error);
    },
  });

  return { actionMutation };
}
