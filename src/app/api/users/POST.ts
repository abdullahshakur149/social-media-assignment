import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
// eslint-disable-next-line import/no-extraneous-dependencies
import bcrypt from 'bcryptjs';
// eslint-disable-next-line import/no-extraneous-dependencies
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let username: string | undefined;
    let password: string | undefined;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let profilePhotoUrl: string | undefined;

    if (isMultipart) {
      const form = await request.formData();
      username = (form.get('username') as string) || undefined;
      password = (form.get('password') as string) || undefined;
      firstName = (form.get('firstName') as string) || undefined;
      lastName = (form.get('lastName') as string) || undefined;
      const file = form.get('picture');
      if (file && typeof file !== 'string') {
        const img = file as File;
        if (!img.type.startsWith('image/')) {
          return NextResponse.json({ message: 'invalid image type' }, { status: 400 });
        }
        const ext = img.type.split('/')[1] || 'png';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const arrayBuffer = await img.arrayBuffer();
        const { url } = await put(filename, arrayBuffer, {
          access: 'public',
          contentType: img.type,
        });
        profilePhotoUrl = url;
      }
    } else {
      const body = await request.json();
      username = body.username;
      password = body.password;
      firstName = body.firstName;
      lastName = body.lastName;
    }

    if (!username || !password) {
      return NextResponse.json({ message: 'username and password are required' }, { status: 400 });
    }
    if (username.length < 3 || password.length < 6) {
      return NextResponse.json({ message: 'invalid username or password length' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { username } });
    if (existing) {
      return NextResponse.json({ message: 'username already taken' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        username,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        passwordHash,
        profilePhoto: profilePhotoUrl ?? undefined,
      },
    });
    const user = {
      id: created.id,
      username: created.username!,
      firstName: created.firstName ?? null,
      lastName: created.lastName ?? null,
      profilePhoto: created.profilePhoto ?? null,
    };
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'internal error' }, { status: 500 });
  }
}
