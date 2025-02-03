import { InvalidFieldUpdateError } from '../errorTypes';
import pool from './db';

class BaseModel<T> {
  protected table: string;

  constructor(table: string) {
    this.table = table;
  }

  // Get all records (excluding soft-deleted ones)
  async getAll(): Promise<T[]> {
    const result = await pool.query(
      `SELECT * FROM "${this.table}" WHERE "deletedAt" IS NULL`,
    );
    return result.rows as T[];
  }

  // Get a record by ID (excluding soft-deleted ones)
  async getById(id: string): Promise<T | null> {
    const result = await pool.query(
      `SELECT * FROM "${this.table}" WHERE "id" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
    return (result.rows[0] as T) || null;
  }

  // Get records by column (excluding soft-deleted ones)
  async getAllByColumn<K extends keyof T>(
    column: K,
    value: T[K],
  ): Promise<T[]> {
    const query = `SELECT * FROM "${this.table}" WHERE "${String(column)}" = $1 AND "deletedAt" IS NULL`;
    const result = await pool.query(query, [value]);
    return result.rows as T[];
  }

  // Create a new record
  async create(data: Partial<T>): Promise<T> {
    // Wrap each column name in double quotes
    const keys = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ');

    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO "${this.table}" (${keys}) VALUES (${placeholders}) RETURNING *;`;

    const result = await pool.query(query, values);
    return result.rows[0] as T;
  }

  // Update a record (excluding accidental updates to deletedAt)
  async update(id: string, data: Partial<T>): Promise<T | null> {
    if ('deletedAt' in data) {
      throw new InvalidFieldUpdateError('deletedAt');
    }

    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) return null;

    // Wrap each column name in double quotes in the SET clause
    const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');

    const query = `UPDATE "${this.table}" 
                 SET ${setClause} 
                 WHERE "id" = $${keys.length + 1} 
                   AND "deletedAt" IS NULL 
                 RETURNING *;`;

    const result = await pool.query(query, [...values, id]);
    return (result.rows[0] as T) || null;
  }

  // Soft delete a record by setting deletedAt to NOW()
  async softDelete(id: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE "${this.table}" SET "deletedAt" = NOW() WHERE "id" = $1 RETURNING id`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  // Restore a soft-deleted record by setting deletedAt to NULL
  async restore(id: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE "${this.table}" SET "deletedAt" = NULL WHERE "id" = $1 RETURNING id`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  // Delete records based on a column condition
  async hardDeleteOnCondition<K extends keyof T>(
    column: K,
    value: T[K],
  ): Promise<number> {
    const result = await pool.query(
      `DELETE FROM "${this.table}" WHERE "${String(column)}" = $1 RETURNING id`,
      [value],
    );
    return result.rowCount ?? 0;
  }
}

export default BaseModel;
