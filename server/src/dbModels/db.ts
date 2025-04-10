import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432, // Default PostgreSQL port
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('Error connecting to the PostgreSQL database:', err);
});

export const query = async (text: string, params?: any[]): Promise<any[]> => {
  try {
    const result = await pool.query(text, params);
    return result.rows; // Return only the rows
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

export default pool;
