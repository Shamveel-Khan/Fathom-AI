/**
 * Repository singletons.
 *
 * To migrate from JSON → PostgreSQL:
 *   1. Create src/lib/repositories/postgresRepository.ts implementing the same interfaces.
 *   2. Replace the two exports below.
 *   3. No changes needed in API routes or UI.
 */

import { JsonUserRepository, JsonMeetingRepository } from './jsonRepository';
import type { IUserRepository, IMeetingRepository } from './types';

export const userRepository: IUserRepository = new JsonUserRepository();
export const meetingRepository: IMeetingRepository = new JsonMeetingRepository();

// Re-export interfaces for convenience
export type { IUserRepository, IMeetingRepository };
