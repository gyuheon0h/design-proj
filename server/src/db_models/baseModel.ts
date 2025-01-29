import pool from './db';

class BaseModel<T> {
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  // Get all records
  async getAll(): Promise<T[]> {
    const result = await pool.query(`SELECT * FROM "${this.table}"`);
    return result.rows as T[];
  }

  // Get a record by ID
  async getById(id: string): Promise<T | null> {
    const result = await pool.query(
      `SELECT * FROM "${this.table}" WHERE id = $1`,
      [id],
    );
    return (result.rows[0] as T) || null;
  }

  // Create a new record
  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO "${this.table}" (${keys}) VALUES (${placeholders}) RETURNING *;`;
    const result = await pool.query(query, values);
    return result.rows[0] as T;
  }

  // Update a record by ID
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) return null;

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const query = `UPDATE "${this.table}" SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *;`;
    const result = await pool.query(query, [...values, id]);

    return (result.rows[0] as T) || null;
  }

  // Delete a record by ID
  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM "${this.table}" WHERE id = $1 RETURNING id`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export default BaseModel;
