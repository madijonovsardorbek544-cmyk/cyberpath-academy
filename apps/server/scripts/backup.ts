import fs from 'fs';
import path from 'path';
import { env } from '../src/config/env.js';
import { db } from '../src/lib/db.js';

const backupsDir = path.resolve(path.dirname(env.databasePath), 'backups');
fs.mkdirSync(backupsDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(backupsDir, `cyberpath-${timestamp}.db`);
// VACUUM INTO includes WAL contents and produces a consistent copy; copying the file does not.
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
console.log(`Backup created at ${target}`);
