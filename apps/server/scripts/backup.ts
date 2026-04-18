import fs from 'fs';
import path from 'path';
import { env } from '../src/config/env.js';

const backupsDir = path.resolve(path.dirname(env.databasePath), 'backups');
fs.mkdirSync(backupsDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(backupsDir, `cyberpath-${timestamp}.db`);
fs.copyFileSync(env.databasePath, target);
console.log(`Backup created at ${target}`);
