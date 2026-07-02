import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../..');

async function createBackup() {
  try {
    const dbPath = env.databasePath;
    const dataDir = path.dirname(dbPath);

    if (!fs.existsSync(dataDir)) {
      logger.warn('database.directory.does.not.exist', { path: dataDir });
      return;
    }

    if (!fs.existsSync(dbPath)) {
      logger.warn('database.file.does.not.exist', { path: dbPath });
      return;
    }

    const backupDir = path.resolve(serverRoot, 'data/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `cyberpath-${timestamp}.db.bak`);

    fs.copyFileSync(dbPath, backupPath);

    logger.info('database.backup.created', { backupPath });

    // Keep only last 7 backups
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith('cyberpath-') && f.endsWith('.db.bak'))
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    for (let i = 7; i < files.length; i++) {
      const oldBackup = path.join(backupDir, files[i].name);
      fs.unlinkSync(oldBackup);
      logger.info('database.backup.deleted', { backupPath: oldBackup });
    }
  } catch (error) {
    logger.error('database.backup.failed', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

createBackup();
