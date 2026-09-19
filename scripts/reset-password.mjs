import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { hashPassword } from '@better-auth/utils/password';

dotenv.config({ path: '.env.local' });

async function resetPassword() {
  const email = process.argv[2]?.trim().toLowerCase();
  const newPassword = process.argv[3]?.trim();

  if (!email || !newPassword) {
    console.error('Usage: node scripts/reset-password.mjs <email> <password>');
    console.error('Example: node scripts/reset-password.mjs aamir.syed7082@gmail.com Syed@1234');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || 'ZeroPlate_ai_MVP');

  const user = await db.collection('user').findOne({ email });
  if (!user) {
    console.error(`User not found with email: ${email}`);
    await client.close();
    process.exit(1);
  }

  const hashedPassword = await hashPassword(newPassword);

  const existingAccount = await db.collection('account').findOne({
    userId: user._id,
    providerId: 'credential',
  });

  if (existingAccount) {
    await db.collection('account').updateOne(
      { _id: existingAccount._id },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    console.log(`✓ Password successfully reset for ${email}`);
  } else {
    await db.collection('account').insertOne({
      accountId: user._id.toString(),
      providerId: 'credential',
      userId: user._id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✓ Credential account created with password for ${email}`);
  }

  console.log(`Email: ${email}`);
  console.log(`New Password: ${newPassword}`);
  console.log(`Role: ${user.role || 'user'}`);

  await client.close();
}

resetPassword().catch(console.error);
