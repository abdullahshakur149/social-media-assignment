import 'server-only';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { getServerUser } from '@/lib/getServerUser';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export async function useUpdateProfileAndCoverPhoto({
  request,
  userIdParam,
  toUpdate,
}: {
  request: Request;
  userIdParam: string;
  toUpdate: 'profilePhoto' | 'coverPhoto';
}) {
  const [user] = await getServerUser();
  if (!user || user.id !== userIdParam) {
    return NextResponse.json({}, { status: 401 });
  }
  const userId = user.id;

  const formData = await request.formData();
  const file = formData.get('file') as Blob | null;

  if (!file) {
    return NextResponse.json({ error: 'File blob is required.' }, { status: 400 });
  }

  try {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    // Convert file to base64 for local storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');

    // Store the base64 data as the file name (temporary solution)
    // In a real implementation, you might want to store files in a local directory
    // or use a different cloud storage service
    const fileData = `data:${file.type};base64,${base64Data}`;

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        [toUpdate]: fileData,
      },
    });

    await prisma.post.create({
      data: {
        userId,
        content: toUpdate === 'profilePhoto' ? '#NewProfilePhoto' : '#NewCoverPhoto',
        visualMedia: {
          create: [
            {
              userId,
              fileName: fileData,
              type: 'PHOTO',
            },
          ],
        },
      },
    });

    return NextResponse.json({ uploadedTo: fileData });
  } catch (error) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
