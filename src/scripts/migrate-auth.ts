import 'dotenv/config';
import { query } from '../lib/db/client';
import { hashPassword } from '../lib/auth/password';
import { runMigrations } from '../lib/db/migrate';

export async function migrateAuth() {
  console.log('--- Migrating Database Auth to Hashed Passwords ---');
  await runMigrations();

  const users = await query<{ id: string; password: string | null; password_hash: string | null }>(
    'SELECT id, password, password_hash FROM users'
  );

  console.log(`Found ${users.length} users to inspect.`);

  for (const user of users) {
    if (!user.password_hash) {
      const plaintext = user.password || 'password123';
      const hash = await hashPassword(plaintext);
      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hash, user.id]
      );
      console.log(`Migrated user ${user.id} to bcrypt password hash.`);
    } else {
      console.log(`User ${user.id} already has password_hash.`);
    }
  }

  console.log('--- Auth migration complete ---');
}

if (require.main === module) {
  migrateAuth()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
