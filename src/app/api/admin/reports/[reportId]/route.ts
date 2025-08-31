import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { ReportStatus } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: { reportId: string } }) {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get user with role from database
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    // Check if user is admin
    if (userWithRole?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const reportId = parseInt(params.reportId, 10);
    if (!Number.isInteger(reportId) || reportId <= 0) {
      return NextResponse.json({ message: 'Invalid report ID' }, { status: 400 });
    }

    const { action, adminNotes } = await req.json();

    if (!['dismiss', 'block_post', 'review'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Get the report with post details
    const report = await prisma.postReport.findUnique({
      where: { id: reportId },
      include: {
        post: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      let status: string;
      let postDeleted = false;

      switch (action) {
        case 'dismiss':
          status = 'DISMISSED';
          break;
        case 'block_post':
          status = 'POST_BLOCKED';
          break;
        case 'review':
          status = 'REVIEWED';
          break;
        default:
          throw new Error('Invalid action');
      }

      // Update the report FIRST
      const updatedReport = await tx.postReport.update({
        where: { id: reportId },
        data: {
          status: status as ReportStatus,
          adminNotes: adminNotes || null,
          adminId: user.id,
          adminActionAt: new Date(),
        },
      });

      // THEN delete the post if it's a block_post action
      if (action === 'block_post') {
        await tx.post.delete({
          where: { id: report.postId },
        });
        postDeleted = true;
        // Note: The report will be cascade deleted, so we can't return updatedReport
        return { updatedReport: null, postDeleted };
      }

      return { updatedReport, postDeleted };
    });

    return NextResponse.json({
      message: `Report ${action === 'block_post' ? 'processed and post blocked' : action}d successfully`,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing report:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
