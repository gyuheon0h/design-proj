import { Pool } from 'pg';

// PUT ALL THIS IN ENV FILE
const pool = new Pool({
  user: 'postgres', // Replace with our Postgres username
  host: 'YOUR_CLOUD_SQL_PUBLIC_IP', // Replace with our public IP of Cloud SQL instance
  database: 'myappdb', // Replace with our database name
  password: 'YOUR_PASSWORD', // Replace with our database password
  port: 5432, // Default Postgres port
});

export default pool;
