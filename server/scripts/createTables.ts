import { Client } from 'pg';

// REPLACE WITH OUR VALUES. USE ENV FILE
const client = new Client({
  user: 'your-db-user',
  host: 'your-db-host',
  database: 'your-database',
  password: 'your-db-password',
  port: 5432,
});

const createTables = async () => {
  try {
    await client.connect();

    console.log('Connected to the database.');

    // SQL to create the Users table
    await client.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id UUID PRIMARY KEY, 
                email VARCHAR(255) UNIQUE NOT NULL
            );
        `);
    console.log('Table "Users" created.');

    // SQL to create the Folder table
    await client.query(`
            CREATE TABLE IF NOT EXISTS Folder (
                id UUID PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                ownerId UUID NOT NULL,
                parentFolderId UUID,
                createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deletedAt TIMESTAMPTZ DEFAULT NULL,
                CONSTRAINT fk_folder_owner FOREIGN KEY (ownerId) REFERENCES Users(id) ON DELETE CASCADE,
                CONSTRAINT fk_folder_parent FOREIGN KEY (parentFolderId) REFERENCES Folder(id) ON DELETE CASCADE
            );
        `);
    console.log('Table "Folder" created.');

    // SQL to create the File table
    await client.query(`
            CREATE TABLE IF NOT EXISTS File (
                id UUID PRIMARY KEY,
                ownerId UUID NOT NULL,
                fileName VARCHAR(255) NOT NULL,
                parentFolderId UUID,
                size INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                storagePath TEXT NOT NULL,
                createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deletedAt TIMESTAMPTZ DEFAULT NULL,
                CONSTRAINT fk_file_owner FOREIGN KEY (ownerId) REFERENCES Users(id) ON DELETE CASCADE,
                CONSTRAINT fk_file_parent FOREIGN KEY (parentFolderId) REFERENCES Folder(id) ON DELETE CASCADE
            );
        `);
    console.log('Table "File" created.');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await client.end();
    console.log('Disconnected from the database.');
  }
};

createTables();
// npx ts-node createTables.ts
