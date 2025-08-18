/**
 * Database Service
 * 
 * This file re-exports everything from database-service.ts.
 * This allows existing code to continue working while adopting the
 * new centralized pattern for all database operations.
 */

import * as databaseService from './database-service';

// Re-export everything from database-service
export * from './database-service';
export default databaseService.db;
