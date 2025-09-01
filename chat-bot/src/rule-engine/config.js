module.exports = {
  // Rule evaluation settings
  evaluation: {
    timeout: 100, // ms
    maxRules: 50
  },
  
  // Caching settings
  caching: {
    enabled: true,
    ttl: 300, // seconds
    prefix: 'rule:'
  },
  
  // Performance settings
  performance: {
    compileRules: true,
    preloadEnabledRules: true
  }
};