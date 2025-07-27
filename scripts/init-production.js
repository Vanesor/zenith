// Production initialization script
import { initializeDatabase } from '../src/lib/database.js';
import { initializeMonitoring } from '../src/lib/MonitoringService.js';
import { SessionManager } from '../src/lib/SessionManager.js';
import fs from 'fs';
import path from 'path';

async function initializeProduction() {
  console.log('🚀 Initializing Zenith Forum for production...');

  try {
    // Initialize database connection
    console.log('📦 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database connected successfully');

    // Initialize monitoring
    console.log('📊 Starting monitoring services...');
    initializeMonitoring();
    console.log('✅ Monitoring services started');

    // Clean up old sessions
    console.log('🧹 Cleaning up expired sessions...');
    const cleanedSessions = await SessionManager.cleanupExpiredSessions();
    console.log(`✅ Cleaned up ${cleanedSessions} expired sessions`);

    // Create necessary directories
    console.log('📁 Creating necessary directories...');
    
    const dirs = ['logs', 'uploads', 'temp'];
    for (const dir of dirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    }

    console.log('🎉 Production initialization completed successfully!');
    console.log('\n📊 System Status:');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Node Version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Memory Usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
    
  } catch (error) {
    console.error('❌ Production initialization failed:', error);
    process.exit(1);
  }
}

export { initializeProduction };
