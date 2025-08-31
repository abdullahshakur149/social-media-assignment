import { Item, Section } from 'react-stately';
import { useDialogs } from '@/hooks/useDialogs';
import { GetVisualMedia } from '@/types/definitions';
import { Key, useCallback } from 'react';
import { useCreatePostModal } from '@/hooks/useCreatePostModal';
import { useDeletePostMutation } from '@/hooks/mutations/useDeletePostMutation';
import { useReportPostMutation } from '@/hooks/mutations/useReportPostMutation';
import { useToast } from '@/hooks/useToast';
import { DropdownMenuButton } from './ui/DropdownMenuButton';

export function PostOptions({
  postId,
  content,
  visualMedia,
  isOwnPost,
}: {
  postId: number;
  content: string | null;
  visualMedia?: GetVisualMedia[];
  isOwnPost: boolean;
}) {
  const { confirm, prompt } = useDialogs();
  const { launchEditPost } = useCreatePostModal();
  const { deleteMutation } = useDeletePostMutation();
  const { reportMutation } = useReportPostMutation();
  const { showToast } = useToast();

  const handleDeleteClick = useCallback(() => {
    confirm({
      title: 'Delete Post',
      message: 'Do you really wish to delete this post?',
      onConfirm: () => {
        // Wait for the dialog to close before deleting the comment to pass the focus to
        // the next element first, preventing the focus from resetting to the top
        setTimeout(() => deleteMutation.mutate({ postId }), 300);
      },
    });
  }, [confirm, deleteMutation, postId]);

  const handleEditClick = useCallback(() => {
    launchEditPost({
      postId,
      initialContent: content ?? '',
      initialVisualMedia: visualMedia ?? [],
    });
  }, [launchEditPost, postId, content, visualMedia]);

  const handleOptionClick = useCallback(
    (key: Key) => {
      if (key === 'edit') {
        handleEditClick();
      } else if (key === 'report') {
        prompt({
          title: 'Report Post',
          message: 'Tell us briefly what is wrong with this post.',
          promptLabel: 'Reason',
          promptType: 'textarea',
          onSubmit: (value: string) => {
            reportMutation
              .mutateAsync({ postId, reason: value.trim() })
              .then(() => showToast({ title: 'Reported', message: 'Report submitted', type: 'success' }))
              .catch(() => {});
          },
        });
      } else {
        handleDeleteClick();
      }
    },
    [handleEditClick, handleDeleteClick, reportMutation, postId, showToast, prompt],
  );

  return (
    <DropdownMenuButton key={`posts-${postId}-options`} label="Post options" onAction={handleOptionClick}>
      <Section>
        {isOwnPost ? (
          <>
            <Item key="edit">Edit Post</Item>
            <Item key="delete">Delete Post</Item>
          </>
        ) : (
          <Item key="report">Report Post</Item>
        )}
      </Section>
    </DropdownMenuButton>
  );
}
