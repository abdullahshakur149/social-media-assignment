import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const user = await getServerUser();
    if (!user || !Array.isArray(user) || user.length === 0) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = user[0];
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const postIdNum = Number(params.postId);
    if (!Number.isInteger(postIdNum) || postIdNum <= 0) {
      return NextResponse.json({ message: 'Invalid postId' }, { status: 400 });
    }

    const { reason } = await req.json();
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ message: 'Reason is required' }, { status: 400 });
    }

    // Ensure the post exists
    const post = await prisma.post.findUnique({ where: { id: postIdNum }, select: { id: true } });
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // Create report or return conflict if already reported by this user
    try {
      await prisma.postReport.create({
        data: {
          postId: postIdNum,
          userId: currentUser.id,
          reason: reason.trim(),
        },
      });
    } catch (error: unknown) {
      // Use type assertion to access 'code' property
      if ((error as unknown as { code?: string })?.code === 'P2002') {
        return NextResponse.json({ message: 'You already reported this post' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Report submitted' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
