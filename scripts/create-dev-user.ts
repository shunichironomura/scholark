import { db } from '../src/backend/db/index';
import { user } from '../src/backend/db/schema';
import { eq } from 'drizzle-orm';

async function createDevUser() {
  try {
    // Check if dev user already exists
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.id, 'dev-user-id'))
      .limit(1);

    if (existingUsers.length > 0) {
      console.log('Development user already exists');
      return;
    }

    // Insert development user
    await db.insert(user).values({
      id: 'dev-user-id',
      name: 'Development User',
      email: 'dev@example.com',
      oauthProvider: 'development',
      oauthProviderUserId: 'dev-user-id',
      calendarToken: 'dev-calendar-token',
    });

    console.log('Development user created successfully');
  } catch (error) {
    console.error('Error creating development user:', error);
  } finally {
    process.exit(0);
  }
}

createDevUser();
