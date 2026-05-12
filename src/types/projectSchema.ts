export interface ProjectMigrationResult<T> {
  project: T;
  migrated: boolean;
  fromVersion?: string;
  toVersion: string;
  warnings: string[];
}
