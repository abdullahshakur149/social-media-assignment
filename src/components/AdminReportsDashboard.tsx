'use client';

import React, { useState, useCallback } from 'react';
import { useAdminReportsQuery } from '@/hooks/queries/useAdminReportsQuery';
import { useAdminReportActionsMutation } from '@/hooks/mutations/useAdminReportActionsMutation';
import { useDialogs } from '@/hooks/useDialogs';
import { formatDistanceToNow } from 'date-fns';
import Button from './ui/Button';
import { Badge } from './ui/Badge';
import { ProfilePhoto } from './ui/ProfilePhoto';

type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'POST_BLOCKED';
type ActionType = 'dismiss' | 'block_post' | 'review';

const statusLabels: Record<ReportStatus, string> = {
  PENDING: 'Pending',
  REVIEWED: 'Reviewed',
  DISMISSED: 'Dismissed',
  POST_BLOCKED: 'Post Blocked',
};

type PostContentProps = {
  post: {
    content?: string | null;
    createdAt: string;
    user: {
      profilePhoto?: string | null;
      username?: string | null;
      name?: string | null;
    };
    visualMedia?: Array<{
      id: number;
      fileName: string;
      type: 'VIDEO' | 'PHOTO';
    }> | null;
  };
};

function PostContent({ post }: PostContentProps) {
  return (
    <div className="border-l-4 border-border pl-4">
      <div className="mb-2 flex items-center gap-3">
        <ProfilePhoto
          photoUrl={post.user.profilePhoto}
          username={post.user.username || 'unknown'}
          name={post.user.name || post.user.username || 'Unknown'}
        />
        <div>
          <p className="font-medium">{post.user.name || post.user.username || 'Unknown'}</p>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {post.content && <p className="mb-2 text-sm">{post.content}</p>}

      {post.visualMedia && post.visualMedia.length > 0 && (
        <div className="flex gap-2">
          {post.visualMedia.slice(0, 3).map((media) => (
            <div key={media.id} className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-xs">
              {media.type === 'VIDEO' ? '🎥' : '📷'}
            </div>
          ))}
          {post.visualMedia.length > 3 && (
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-xs">
              +{post.visualMedia.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type ReportCardProps = {
  report: {
    id: number;
    status: ReportStatus;
    reason: string;
    createdAt: string;
    adminNotes?: string | null;
    user: {
      profilePhoto?: string | null;
      username?: string | null;
      name?: string | null;
    };
    post: {
      content?: string | null;
      createdAt: string;
      user: {
        profilePhoto?: string | null;
        username?: string | null;
        name?: string | null;
      };
      visualMedia?: Array<{
        id: number;
        fileName: string;
        type: 'VIDEO' | 'PHOTO';
      }> | null;
    };
    admin?: {
      name?: string | null;
      username?: string | null;
    } | null;
  };
  onAction: (reportId: number, action: ActionType) => void;
  isActionDisabled: boolean;
};

function ReportCard({ report, onAction, isActionDisabled }: ReportCardProps) {
  const handleReview = useCallback(() => onAction(report.id, 'review'), [onAction, report.id]);
  const handleDismiss = useCallback(() => onAction(report.id, 'dismiss'), [onAction, report.id]);
  const handleBlockPost = useCallback(() => {
    console.log('Block Post button clicked for report:', report.id);
    onAction(report.id, 'block_post');
  }, [onAction, report.id]);

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ProfilePhoto
            photoUrl={report.user.profilePhoto}
            username={report.user.username || 'unknown'}
            name={report.user.name || report.user.username || 'Unknown'}
          />
          <div>
            <p className="font-medium">Reported by {report.user.name || report.user.username || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Badge>{statusLabels[report.status as ReportStatus]}</Badge>
      </div>

      <div className="rounded-md bg-muted/50 p-3">
        <p className="mb-1 text-sm font-medium">Report Reason:</p>
        <p className="text-sm">{report.reason}</p>
      </div>

      <PostContent post={report.post} />

      {report.status === 'PENDING' && (
        <div className="flex gap-2 border-t border-border pt-3">
          <Button size="small" mode="ghost" onPress={handleReview} isDisabled={isActionDisabled}>
            Mark Reviewed
          </Button>
          <Button size="small" mode="ghost" onPress={handleDismiss} isDisabled={isActionDisabled}>
            Dismiss
          </Button>
          <Button size="small" mode="secondary" onPress={handleBlockPost} isDisabled={isActionDisabled}>
            Block Post
          </Button>
        </div>
      )}

      {report.adminNotes && (
        <div className="rounded-md bg-blue-50 p-3">
          <p className="mb-1 text-sm font-medium">Admin Notes:</p>
          <p className="text-sm">{report.adminNotes}</p>
          {report.admin && (
            <p className="mt-1 text-xs text-muted-foreground">
              By {report.admin.name || report.admin.username || 'Admin'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminReportsDashboard() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminReportsQuery(page, 10, 'ALL');
  const { actionMutation } = useAdminReportActionsMutation();
  const { confirm, prompt } = useDialogs();

  const handleAction = useCallback(
    (reportId: number, action: ActionType) => {
      console.log('handleAction called with:', { reportId, action });

      const handleMutation = (notes?: string) => {
        console.log('handleMutation called with notes:', notes);
        actionMutation.mutate({ reportId, action, adminNotes: notes });
      };

      if (action === 'block_post') {
        console.log('Showing confirm dialog for block_post');
        confirm({
          title: 'Block Post',
          message: 'Are you sure you want to block this post? This action cannot be undone.',
          onConfirm: () => {
            console.log('Confirm dialog confirmed, showing prompt');
            prompt({
              title: 'Admin Notes',
              message: 'Please provide a brief reason for blocking this post:',
              promptLabel: 'Notes',
              promptType: 'textarea',
              onSubmit: handleMutation,
            });
          },
        });
      } else if (action === 'dismiss') {
        prompt({
          title: 'Dismiss Report',
          message: 'Please provide a brief reason for dismissing this report:',
          promptLabel: 'Notes',
          promptType: 'textarea',
          onSubmit: handleMutation,
        });
      } else {
        handleMutation();
      }
    },
    [actionMutation, confirm, prompt],
  );

  // Move hooks before any conditional returns
  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => Math.min(data?.pagination?.pages || 1, p + 1));
  }, [data?.pagination?.pages]);

  if (isLoading) return <div className="py-8 text-center">Loading reports...</div>;
  if (error) return <div className="py-8 text-center text-red-600">Error loading reports</div>;
  if (!data?.reports?.length) return <div className="py-8 text-center">No reports found</div>;

  const { reports, pagination } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reported Posts</h1>
        <p className="text-muted-foreground">Total: {pagination.total} reports</p>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onAction={handleAction}
            isActionDisabled={actionMutation.isPending}
          />
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button size="small" mode="ghost" onPress={handlePrevPage} isDisabled={page === 1}>
            Previous
          </Button>
          <span className="px-3 py-2">
            Page {page} of {pagination.pages}
          </span>
          <Button size="small" mode="ghost" onPress={handleNextPage} isDisabled={page === pagination.pages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
