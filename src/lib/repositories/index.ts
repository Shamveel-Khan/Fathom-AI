/**
 * Repository singletons.
 *
 * Automatically connects to Neon PostgreSQL when DATABASE_URL is set,
 * and falls back to JSON file storage when running locally without a database.
 */

import { JsonUserRepository, JsonMeetingRepository } from './jsonRepository';
import { PostgresUserRepository, PostgresMeetingRepository } from './postgresRepository';
import type { IUserRepository, IMeetingRepository } from './types';

const usePostgres = Boolean(process.env.DATABASE_URL);

export const userRepository: IUserRepository = usePostgres
  ? new PostgresUserRepository()
  : new JsonUserRepository();

export const meetingRepository: IMeetingRepository = usePostgres
  ? new PostgresMeetingRepository()
  : new JsonMeetingRepository();

// Re-export interfaces for convenience
export type { IUserRepository, IMeetingRepository };
