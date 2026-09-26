/**
 * Repository singletons.
 *
 * Automatically connects to Neon PostgreSQL when DATABASE_URL is set,
 * and falls back to JSON file storage when running locally without a database.
 */

import { JsonUserRepository, JsonMeetingRepository, JsonSearchRepository, JsonShareRepository } from './jsonRepository';
import { PostgresUserRepository, PostgresMeetingRepository, PostgresSearchRepository } from './postgresRepository';
import { PostgresShareRepository } from './postgresShareRepository';
import type { IUserRepository, IMeetingRepository, ISearchRepository, IShareRepository } from './types';

const usePostgres = Boolean(process.env.DATABASE_URL);

export const userRepository: IUserRepository = usePostgres
  ? new PostgresUserRepository()
  : new JsonUserRepository();

export const meetingRepository: IMeetingRepository = usePostgres
  ? new PostgresMeetingRepository()
  : new JsonMeetingRepository();

export const searchRepository: ISearchRepository = usePostgres
  ? new PostgresSearchRepository()
  : new JsonSearchRepository();

export const shareRepository: IShareRepository = usePostgres
  ? new PostgresShareRepository()
  : new JsonShareRepository();

// Re-export interfaces for convenience
export type { IUserRepository, IMeetingRepository, ISearchRepository, IShareRepository };
