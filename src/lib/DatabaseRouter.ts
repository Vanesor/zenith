import { Pool, QueryResult } from "pg";

// Database query result type
type DatabaseResult = QueryResult<Record<string, unknown>>;

// Master database for writes
const masterPool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "zenith",
  password: process.env.DB_PASSWORD || "1234",
  port: parseInt(process.env.DB_PORT || "5432"),
  max: parseInt(process.env.DB_MASTER_POOL_MAX || "30"),
  min: parseInt(process.env.DB_MASTER_POOL_MIN || "5"),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Read replica pools for high-scale reads
const readReplicas: Pool[] = [];

// Initialize read replicas
function initializeReadReplicas() {
  const replicaHosts = process.env.DB_READ_REPLICAS?.split(',') || [];
  
  for (const host of replicaHosts) {
    const replicaPool = new Pool({
      user: process.env.DB_USER || "postgres",
      host: host.trim(),
      database: process.env.DB_NAME || "zenith",
      password: process.env.DB_PASSWORD || "1234",
      port: parseInt(process.env.DB_PORT || "5432"),
      max: parseInt(process.env.DB_REPLICA_POOL_MAX || "50"),
      min: parseInt(process.env.DB_REPLICA_POOL_MIN || "10"),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    readReplicas.push(replicaPool);
  }
  
  console.log(`Initialized ${readReplicas.length} read replicas`);
}

// Initialize on module load
initializeReadReplicas();

// Smart query routing
export class DatabaseRouter {
  private static replicaIndex = 0;

  // Route write operations to master
  static async write(query: string, params?: unknown[]): Promise<DatabaseResult> {
    try {
      const client = await masterPool.connect();
      const result = await client.query(query, params);
      client.release();
      return result;
    } catch (error) {
      console.error('Master database write error:', error);
      throw error;
    }
  }

  // Route read operations to replicas (round-robin)
  static async read(query: string, params?: unknown[]): Promise<DatabaseResult> {
    if (readReplicas.length === 0) {
      // Fallback to master if no replicas
      return this.write(query, params);
    }

    try {
      // Round-robin selection
      const replica = readReplicas[this.replicaIndex];
      this.replicaIndex = (this.replicaIndex + 1) % readReplicas.length;

      const client = await replica.connect();
      const result = await client.query(query, params);
      client.release();
      return result;
    } catch (error) {
      console.error('Read replica error, falling back to master:', error);
      // Fallback to master on replica failure
      return this.write(query, params);
    }
  }

  // Intelligent query analysis
  static async query(query: string, params?: unknown[]): Promise<DatabaseResult> {
    const queryType = this.analyzeQuery(query);
    
    if (queryType === 'read') {
      return this.read(query, params);
    } else {
      return this.write(query, params);
    }
  }

  // Analyze query type
  private static analyzeQuery(query: string): 'read' | 'write' {
    const normalizedQuery = query.trim().toLowerCase();
    
    if (normalizedQuery.startsWith('select') || 
        normalizedQuery.startsWith('with') ||
        normalizedQuery.startsWith('show') ||
        normalizedQuery.startsWith('explain')) {
      return 'read';
    }
    
    return 'write';
  }

  // Get connection statistics
  static getStats() {
    return {
      master: {
        totalCount: masterPool.totalCount,
        idleCount: masterPool.idleCount,
        waitingCount: masterPool.waitingCount
      },
      replicas: readReplicas.map((replica, index) => ({
        index,
        totalCount: replica.totalCount,
        idleCount: replica.idleCount,
        waitingCount: replica.waitingCount
      }))
    };
  }

  // Health check all databases
  static async healthCheck(): Promise<{
    master: boolean;
    replicas: boolean[];
    healthy: boolean;
  }> {
    const results = {
      master: false,
      replicas: [] as boolean[],
      healthy: false
    };

    try {
      // Check master
      const masterClient = await masterPool.connect();
      await masterClient.query('SELECT 1');
      masterClient.release();
      results.master = true;
    } catch (error) {
      console.error('Master health check failed:', error);
    }

    // Check replicas
    for (let i = 0; i < readReplicas.length; i++) {
      try {
        const replicaClient = await readReplicas[i].connect();
        await replicaClient.query('SELECT 1');
        replicaClient.release();
        results.replicas[i] = true;
      } catch (error) {
        console.error(`Replica ${i} health check failed:`, error);
        results.replicas[i] = false;
      }
    }

    // System is healthy if master is up and at least one replica (or no replicas configured)
    results.healthy = results.master && (readReplicas.length === 0 || results.replicas.some(r => r));

    return results;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await masterPool.end();
  await Promise.all(readReplicas.map(replica => replica.end()));
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await masterPool.end();
  await Promise.all(readReplicas.map(replica => replica.end()));
  process.exit(0);
});
