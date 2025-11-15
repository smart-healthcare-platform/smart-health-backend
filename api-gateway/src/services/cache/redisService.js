const redis = require('redis');
const config = require('../../config');
const logger = require('../../config/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
  }

  /**
   * Initialize Redis client
   */
  async initialize() {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.client = redis.createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis: Maximum retry attempts reached');
              return new Error('Redis connection failed');
            }
            const delay = Math.min(retries * 100, 3000);
            logger.warn(`Redis: Reconnecting in ${delay}ms... (attempt ${retries})`);
            return delay;
          },
        },
        password: config.redis.password,
        database: config.redis.db,
      });

      // Event listeners
      this.client.on('connect', () => {
        logger.info('Redis: Connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis: Client ready');
        this.isConnected = true;
        this.isConnecting = false;
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', {
          message: err.message,
          code: err.code,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        });
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis: Reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis: Connection closed');
        this.isConnected = false;
        this.isConnecting = false;
      });

      // Connect
      await this.client.connect();
      
      logger.info('Redis: Successfully connected', {
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db,
      });

    } catch (error) {
      this.isConnecting = false;
      logger.error('Redis: Failed to initialize', {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Check if Redis is connected
   */
  checkConnection() {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis: Not connected, operation skipped');
      return false;
    }
    return true;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Parsed value or null
   */
  async get(key) {
    if (!this.checkConnection()) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      
      if (!data) {
        logger.debug(`Redis GET: Cache miss for key "${key}"`);
        return null;
      }

      logger.debug(`Redis GET: Cache hit for key "${key}"`);
      return JSON.parse(data);
    } catch (error) {
      logger.error('Redis GET Error:', {
        key,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttlSeconds = null) {
    if (!this.checkConnection()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.setEx(key, ttlSeconds, serialized);
        logger.debug(`Redis SET: Key "${key}" cached with TTL ${ttlSeconds}s`);
      } else {
        await this.client.set(key, serialized);
        logger.debug(`Redis SET: Key "${key}" cached (no TTL)`);
      }
      
      return true;
    } catch (error) {
      logger.error('Redis SET Error:', {
        key,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Delete key(s) from cache
   * Supports wildcard patterns (e.g., "admin:*")
   * @param {string} pattern - Key or pattern to delete
   * @returns {Promise<number>} Number of keys deleted
   */
  async del(pattern) {
    if (!this.checkConnection()) {
      return 0;
    }

    try {
      if (pattern.includes('*')) {
        // Pattern matching - get all matching keys first
        const keys = await this.client.keys(pattern);
        
        if (keys.length === 0) {
          logger.debug(`Redis DEL: No keys found for pattern "${pattern}"`);
          return 0;
        }

        const deleted = await this.client.del(keys);
        logger.debug(`Redis DEL: Deleted ${deleted} keys matching pattern "${pattern}"`);
        return deleted;
      } else {
        // Single key deletion
        const deleted = await this.client.del(pattern);
        logger.debug(`Redis DEL: Deleted key "${pattern}" (${deleted ? 'success' : 'not found'})`);
        return deleted;
      }
    } catch (error) {
      logger.error('Redis DEL Error:', {
        pattern,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if exists
   */
  async exists(key) {
    if (!this.checkConnection()) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS Error:', {
        key,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get TTL (time to live) for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async ttl(key) {
    if (!this.checkConnection()) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL Error:', {
        key,
        error: error.message,
      });
      return -2;
    }
  }

  /**
   * Get all keys matching pattern
   * @param {string} pattern - Key pattern (e.g., "admin:*")
   * @returns {Promise<string[]>} Array of matching keys
   */
  async keys(pattern) {
    if (!this.checkConnection()) {
      return [];
    }

    try {
      const keys = await this.client.keys(pattern);
      logger.debug(`Redis KEYS: Found ${keys.length} keys matching "${pattern}"`);
      return keys;
    } catch (error) {
      logger.error('Redis KEYS Error:', {
        pattern,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Flush all keys in current database
   * USE WITH CAUTION!
   */
  async flushDb() {
    if (!this.checkConnection()) {
      return false;
    }

    try {
      await this.client.flushDb();
      logger.warn('Redis: Database flushed');
      return true;
    } catch (error) {
      logger.error('Redis FLUSHDB Error:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getStats() {
    if (!this.checkConnection()) {
      return {
        connected: false,
        keys: 0,
        adminKeys: 0,
      };
    }

    try {
      const allKeys = await this.client.keys('*');
      const adminKeys = await this.client.keys('admin:*');
      
      return {
        connected: this.isConnected,
        totalKeys: allKeys.length,
        adminKeys: adminKeys.length,
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db,
      };
    } catch (error) {
      logger.error('Redis STATS Error:', error.message);
      return {
        connected: this.isConnected,
        error: error.message,
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis: Disconnected gracefully');
      } catch (error) {
        logger.error('Redis: Error during disconnect', error.message);
      }
    }
  }
}

// Export singleton instance
const redisService = new RedisService();

module.exports = redisService;