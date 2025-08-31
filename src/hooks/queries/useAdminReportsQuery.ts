'use client';

import { useQuery } from '@tanstack/react-query';

interface AdminReport {
  id: number;
  createdAt: string;
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'POST_BLOCKED';
  adminNotes: string | null;
  user: {
    id: string;
    username: string | null;
    name: string | null;
    profilePhoto: string | null;
  };
  post: {
    id: number;
    content: string | null;
    createdAt: string;
    user: {
      id: string;
      username: string | null;
      name: string | null;
      profilePhoto: string | null;
    };
    visualMedia: Array<{
      id: number;
      fileName: string;
      type: 'PHOTO' | 'VIDEO';
    }>;
  };
  admin: {
    id: string;
    username: string | null;
    name: string | null;
  } | null;
  adminActionAt: string | null;
}

interface AdminReportsResponse {
  reports: AdminReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useAdminReportsQuery(page: number = 1, limit: number = 10, status?: string) {
  return useQuery<AdminReportsResponse>({
    queryKey: ['admin', 'reports', page, limit, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      });

      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch reports');
      }
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });
}
