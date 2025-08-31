import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { ReportStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: { status?: ReportStatus } = {};
    if (status && status !== 'ALL') {
      where.status = status as ReportStatus;
    }

    const [reports, total] = await Promise.all([
      prisma.postReport.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePhoto: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  profilePhoto: true,
                },
              },
              visualMedia: {
                select: {
                  id: true,
                  fileName: true,
                  type: true,
                },
              },
            },
          },
          admin: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.postReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
