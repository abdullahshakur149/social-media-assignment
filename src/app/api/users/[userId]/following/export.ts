import prisma from '@/lib/prisma/prisma';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  const rows = [
    ['id', 'username', 'name', 'profilePhoto'],
    ...following.map((f) => [
      f.following.id,
      f.following.username ?? '',
      f.following.name ?? '',
      f.following.profilePhoto ?? '',
    ]),
  ];

  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="following.csv"',
    },
  });
}
