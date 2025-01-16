import { Pool } from "pg";

const pool = new Pool({
  user: "postgres", // Your Postgres username
  host: "YOUR_CLOUD_SQL_PUBLIC_IP", // Replace with the public IP of your Cloud SQL instance
  database: "myappdb", // Replace with your database name
  password: "YOUR_PASSWORD", // Replace with your database password
  port: 5432, // Default Postgres port
});

export default pool;
