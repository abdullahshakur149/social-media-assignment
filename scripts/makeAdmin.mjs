import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ User ${user.email} is now an admin!`);
    console.log(`User ID: ${user.id}`);
    console.log(`Username: ${user.username || 'Not set'}`);
    console.log(`Name: ${user.name || 'Not set'}`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`❌ User with email ${email} not found`);
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node makeAdmin.mjs <email>');
  process.exit(1);
}

makeAdmin(email);
