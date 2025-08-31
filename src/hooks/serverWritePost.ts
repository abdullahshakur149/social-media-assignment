import { selectPost } from '@/lib/prisma/selectPost';
import { formDataToObject } from '@/lib/formDataToObject';
import prisma from '@/lib/prisma/prisma';
import { NextResponse } from 'next/server';
import { GetPost } from '@/types/definitions';
import { isValidFileType } from '@/lib/isValidFileType';
import { postWriteSchema } from '@/lib/validations/post';
import { z } from 'zod';
import { toGetPost } from '@/lib/prisma/toGetPost';
import { getServerUser } from '@/lib/getServerUser';
import { convertMentionUsernamesToIds } from '@/lib/convertMentionUsernamesToIds';
import { mentionsActivityLogger } from '@/lib/mentionsActivityLogger';
import { verifyAccessToPost } from '@/app/api/posts/[postId]/verifyAccessToPost';
// eslint-disable-next-line import/no-extraneous-dependencies
import { put } from '@vercel/blob';
import { VisualMediaType } from '@prisma/client';

// If `type` is `edit`, then the `postId` is required
type Props =
  | {
      formData: FormData;
      type: 'create';
      postId?: undefined;
    }
  | {
      formData: FormData;
      type: 'edit';
      postId: number;
    };

export async function serverWritePost({ formData, type, postId }: Props) {
  const [user] = await getServerUser();
  if (!user) return NextResponse.json({}, { status: 401 });
  const userId = user.id;

  if (type === 'edit') {
    if (!verifyAccessToPost(postId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  try {
    const body = postWriteSchema.parse(formDataToObject(formData));

    const { content, files } = body;
    const { str, usersMentioned } = await convertMentionUsernamesToIds({
      str: content || '',
    });
    const filesArr = !files ? [] : Array.isArray(files) ? files : [files];

    // Validate if files are valid
    for (const file of filesArr) {
      if (typeof file === 'string') continue;
      if (!isValidFileType(file.type)) {
        return NextResponse.json({ error: 'Invalid file type.' }, { status: 415 });
      }
    }

    // Upload media to Vercel Blob (store public URL in fileName)
    const savedFiles: { type: VisualMediaType; fileName: string }[] = await Promise.all(
      filesArr.map(async (file) => {
        if (typeof file === 'string') {
          const isPhoto = /\.(jpg|jpeg|png|webp|gif)$/i.test(file);
          return { type: isPhoto ? 'PHOTO' : 'VIDEO', fileName: file };
        }
        const isPhoto = file.type.startsWith('image/');
        const ext = (file.type.split('/')[1] || 'png').toLowerCase();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        const { url } = await put(filename, arrayBuffer, { access: 'public', contentType: file.type });
        return { type: isPhoto ? 'PHOTO' : 'VIDEO', fileName: url };
      }),
    );

    if (type === 'create') {
      const res = await prisma.post.create({
        data: {
          content: str,
          ...(savedFiles.length > 0 && {
            visualMedia: {
              create: savedFiles.map((savedFile) => ({
                type: savedFile.type,
                fileName: savedFile.fileName,
                userId,
              })),
            },
          }),
          userId,
        },
        select: selectPost(userId),
      });

      // Log the 'POST_MENTION' activity if applicable
      await mentionsActivityLogger({
        usersMentioned,
        activity: {
          type: 'POST_MENTION',
          sourceUserId: userId,
          sourceId: res.id,
        },
        isUpdate: false,
      });

      return NextResponse.json<GetPost>(await toGetPost(res));
    }

    // if (type === 'edit')
    const res = await prisma.post.update({
      where: { id: postId },
      data: {
        content: str,
        ...(files !== undefined && {
          visualMedia: {
            deleteMany: {},
            ...(savedFiles.length > 0 && {
              create: savedFiles.map((savedFile) => ({
                type: savedFile.type,
                fileName: savedFile.fileName,
                userId,
              })),
            }),
          },
        }),
        ...(files === undefined && {
          visualMedia: { deleteMany: {} },
        }),
      },
      select: selectPost(userId),
    });

    // Log the 'POST_MENTION' activity if applicable
    await mentionsActivityLogger({
      usersMentioned,
      activity: {
        type: 'POST_MENTION',
        sourceUserId: userId,
        sourceId: res!.id,
      },
      isUpdate: true,
    });

    return NextResponse.json<GetPost>(await toGetPost(res));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(null, {
        status: 422,
        statusText: error.issues[0].message,
      });
    }

    return NextResponse.json({ error: 'Error creating post.' }, { status: 500 });
  }
}
