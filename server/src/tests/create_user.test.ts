
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

const testInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce email uniqueness', async () => {
    await createUser(testInput);

    await expect(createUser(testInput))
      .rejects.toThrow(/unique/i);
  });

  it('should handle different valid emails', async () => {
    const user1 = await createUser({
      email: 'user1@test.com',
      name: 'User One'
    });

    const user2 = await createUser({
      email: 'user2@test.com',
      name: 'User Two'
    });

    expect(user1.id).not.toEqual(user2.id);
    expect(user1.email).toEqual('user1@test.com');
    expect(user2.email).toEqual('user2@test.com');
  });
});
