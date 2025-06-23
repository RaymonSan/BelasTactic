#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class GitHubBackupService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    this.octokit = new Octokit({
      auth: process.env.BACKUP_GITHUB_TOKEN,
    });

    this.backupRepo = process.env.BACKUP_REPO || 'RaymonSan/belastactic-backups';
    this.backupDir = path.join(process.cwd(), 'temp-backups');
  }

  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async createDatabaseDump() {
    console.log('📊 Creating database dump...');
    
    const tables = [
      'users',
      'households', 
      'questions',
      'answers',
      'scenarios',
      'public_docs',
      'audit_logs',
      'backup_metadata'
    ];

    const dump = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {},
    };

    for (const table of tables) {
      try {
        console.log(`  Exporting ${table}...`);
        
        let query = this.supabase.from(table).select('*');
        
        // For sensitive tables, exclude deleted data and sensitive fields
        if (table === 'users') {
          query = query.select(`
            id, email, role, consent_given_at, consent_version,
            data_retention_until, created_at, updated_at, last_login_at
          `).is('deleted_at', null);
        } else if (table === 'answers') {
          // Exclude the actual encrypted values for privacy
          query = query.select(`
            id, user_id, question_id, household_id, 
            created_at, updated_at
          `);
        } else if (table === 'audit_logs') {
          // Only include recent audit logs (last 30 days)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('created_at', thirtyDaysAgo);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error(`Error exporting ${table}:`, error);
          continue;
        }

        dump.tables[table] = {
          count: data?.length || 0,
          data: data || [],
          exported_at: new Date().toISOString(),
        };
        
        console.log(`  ✅ ${table}: ${data?.length || 0} records`);
      } catch (error) {
        console.error(`Failed to export ${table}:`, error);
      }
    }

    return dump;
  }

  async saveBackupFile(data, type = 'daily') {
    const filename = `backup-${type}-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.backupDir, filename);
    
    console.log(`💾 Saving backup to ${filename}...`);
    
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filepath, content, 'utf-8');
    
    // Calculate file size and checksum
    const stats = await fs.stat(filepath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    return {
      filename,
      filepath,
      size: stats.size,
      checksum: hash,
      content,
    };
  }

  async uploadToGitHub(backupInfo) {
    console.log(`☁️  Uploading ${backupInfo.filename} to GitHub...`);
    
    try {
      // Check if repository exists, create if not
      try {
        await this.octokit.repos.get({ 
          owner: this.backupRepo.split('/')[0],
          repo: this.backupRepo.split('/')[1]
        });
      } catch (error) {
        if (error.status === 404) {
          console.log('Creating backup repository...');
          await this.octokit.repos.createForAuthenticatedUser({
            name: this.backupRepo.split('/')[1],
            description: 'BelasTactic automated backups',
            private: true,
          });
        }
      }

      // Create or update the backup file
      const { data: commit } = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.backupRepo.split('/')[0],
        repo: this.backupRepo.split('/')[1],
        path: `backups/${backupInfo.filename}`,
        message: `Automated backup: ${backupInfo.filename}`,
        content: Buffer.from(backupInfo.content).toString('base64'),
      });

      console.log(`✅ Uploaded to GitHub: ${commit.html_url}`);
      
      return {
        url: commit.html_url,
        sha: commit.sha,
        download_url: commit.download_url,
      };
    } catch (error) {
      console.error('Failed to upload to GitHub:', error);
      throw error;
    }
  }

  async recordBackupMetadata(backupInfo, githubInfo, type = 'daily') {
    console.log('📝 Recording backup metadata...');
    
    const { error } = await this.supabase
      .from('backup_metadata')
      .insert({
        backup_type: type,
        file_path: `backups/${backupInfo.filename}`,
        file_size_bytes: backupInfo.size,
        checksum: backupInfo.checksum,
        github_url: githubInfo.url,
        github_commit_sha: githubInfo.sha,
        status: 'completed',
      });

    if (error) {
      console.error('Failed to record backup metadata:', error);
    } else {
      console.log('✅ Backup metadata recorded');
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up temporary files...');
    
    try {
      const files = await fs.readdir(this.backupDir);
      for (const file of files) {
        await fs.unlink(path.join(this.backupDir, file));
      }
      await fs.rmdir(this.backupDir);
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log('⚠️  Cleanup failed (non-critical):', error.message);
    }
  }

  async performBackup(type = 'daily') {
    console.log(`🚀 Starting ${type} backup process...`);
    
    try {
      await this.ensureBackupDir();
      
      // Create database dump
      const dump = await this.createDatabaseDump();
      
      // Save to local file
      const backupInfo = await this.saveBackupFile(dump, type);
      
      // Upload to GitHub
      const githubInfo = await this.uploadToGitHub(backupInfo);
      
      // Record metadata
      await this.recordBackupMetadata(backupInfo, githubInfo, type);
      
      // Cleanup
      await this.cleanup();
      
      console.log(`✅ ${type} backup completed successfully!`);
      console.log(`📊 Backup stats:`);
      console.log(`   - File size: ${(backupInfo.size / 1024).toFixed(2)} KB`);
      console.log(`   - Tables: ${Object.keys(dump.tables).length}`);
      console.log(`   - Total records: ${Object.values(dump.tables).reduce((sum, table) => sum + table.count, 0)}`);
      console.log(`   - GitHub URL: ${githubInfo.url}`);
      
      return {
        success: true,
        backupInfo,
        githubInfo,
        stats: dump.tables,
      };
    } catch (error) {
      console.error(`❌ ${type} backup failed:`, error);
      
      // Record failed backup
      try {
        await this.supabase
          .from('backup_metadata')
          .insert({
            backup_type: type,
            status: 'failed',
            error_message: error.message,
          });
      } catch (dbError) {
        console.error('Failed to record backup failure:', dbError);
      }
      
      // Cleanup on failure
      await this.cleanup();
      
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'daily';
  
  if (!['daily', 'weekly', 'manual'].includes(type)) {
    console.error('Usage: node backup-to-github.js [daily|weekly|manual]');
    process.exit(1);
  }

  // Validate environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'BACKUP_GITHUB_TOKEN',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }

  const backupService = new GitHubBackupService();
  const result = await backupService.performBackup(type);
  
  if (!result.success) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { GitHubBackupService }; 