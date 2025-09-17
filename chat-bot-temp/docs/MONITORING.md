# Monitoring & Operations Documentation - Chatbot Service

## 📊 Overview

This document provides comprehensive monitoring, logging, and alerting guidelines for the Chatbot Service. It covers health checks, metrics collection, log management, and incident response procedures to ensure system reliability and performance.

## 🩺 Health Checks

### Health Check Endpoints
```yaml
# Health check configuration
health:
  endpoint: /health
  interval: 30s
  timeout: 5s
  dependencies:
    database: true
    redis: true
    ollama: true
    n8n: false  # Optional dependency
```

### Health Check Implementation
```typescript
// src/health/health-check.ts
import { RedisClient } from '../redis';
import { DatabaseService } from '../database';
import { OllamaService } from '../ollama';

export class HealthCheckService {
  constructor(
    private redis: RedisClient,
    private database: DatabaseService,
    private ollama: OllamaService
  ) {}

  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkOllama(),
      this.checkDiskSpace(),
      this.checkMemory()
    ]);

    const status: HealthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      services: {}
    };

    checks.forEach((result, index) => {
      const serviceName = ['database', 'redis', 'ollama', 'disk', 'memory'][index];
      if (result.status === 'fulfilled') {
        status.services[serviceName] = result.value;
      } else {
        status.services[serviceName] = {
          status: 'ERROR',
          error: result.reason.message
        };
        status.status = 'ERROR';
      }
    });

    return status;
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    try {
      await this.database.query('SELECT 1');
      return { status: 'OK', responseTime: Date.now() };
    } catch (error) {
      throw new Error(`Database unreachable: ${error.message}`);
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    try {
      await this.redis.ping();
      return { status: 'OK', responseTime: Date.now() };
    } catch (error) {
      throw new Error(`Redis unreachable: ${error.message}`);
    }
  }
}
```

## 📈 Metrics Collection

### Prometheus Metrics
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'chatbot-service'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'database'
    static_configs:
      - targets: ['localhost:9104']  # MySQL exporter

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']  # Redis exporter
```

### Custom Metrics
```typescript
// src/metrics/metrics-service.ts
import prometheus from 'prom-client';

export class MetricsService {
  private requestDuration: prometheus.Histogram;
  private messageCounter: prometheus.Counter;
  private errorCounter: prometheus.Counter;
  private activeSessions: prometheus.Gauge;

  constructor() {
    this.requestDuration = new prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    this.messageCounter = new prometheus.Counter({
      name: 'chatbot_messages_total',
      help: 'Total number of processed messages',
      labelNames: ['type', 'urgency']
    });

    this.errorCounter = new prometheus.Counter({
      name: 'chatbot_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'component']
    });

    this.activeSessions = new prometheus.Gauge({
      name: 'chatbot_active_sessions',
      help: 'Number of active chat sessions'
    });
  }

  recordMessageProcessing(message: ChatMessage, duration: number) {
    this.messageCounter.inc({
      type: message.type,
      urgency: message.urgency || 'normal'
    });

    this.requestDuration.observe({
      method: 'POST',
      route: '/api/chat',
      status_code: 200
    }, duration);
  }

  recordError(error: Error, component: string) {
    this.errorCounter.inc({
      type: error.constructor.name,
      component: component
    });
  }
}
```

## 📝 Logging Standards

### Log Configuration
```yaml
# config/logging.yaml
version: 1
formatters:
  json:
    format: '%(timestamp)s %(levelname)s %(name)s %(message)s %(context)s'
    class: pythonjsonlogger.jsonlogger.JsonFormatter

handlers:
  console:
    class: logging.StreamHandler
    formatter: json
    level: INFO

  file:
    class: logging.handlers.RotatingFileHandler
    formatter: json
    filename: /var/log/chatbot/service.log
    maxBytes: 10485760  # 10MB
    backupCount: 5
    level: INFO

  error_file:
    class: logging.handlers.RotatingFileHandler
    formatter: json
    filename: /var/log/chatbot/error.log
    maxBytes: 10485760
    backupCount: 5
    level: ERROR

loggers:
  chatbot:
    handlers: [console, file, error_file]
    level: INFO
    propagate: false

  database:
    handlers: [console, file]
    level: WARNING
    propagate: false
```

### Structured Logging
```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'chatbot-service' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage examples
logger.info('User message processed', {
  userId: 'user_123',
  messageLength: 45,
  processingTime: 150,
  sessionId: 'session_abc'
});

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  component: 'database'
});
```

## 🚨 Alerting & Notification

### Alert Rules
```yaml
# alerts/chatbot-alerts.yaml
groups:
- name: chatbot-service
  rules:
  - alert: HighErrorRate
    expr: rate(chatbot_errors_total[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is above 10% for the last 5 minutes"

  - alert: ServiceDown
    expr: up{job="chatbot-service"} == 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Chatbot service is down"
      description: "Service has been down for more than 2 minutes"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is above 2 seconds"

  - alert: MemoryUsageHigh
    expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Memory usage is high"
      description: "Available memory is less than 20%"
```

### Notification Channels
```yaml
# alertmanager.yml
route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-notifications'

  routes:
  - match:
      severity: critical
    receiver: 'pagerduty-emergency'
    group_interval: 1m
    repeat_interval: 30m

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#chatbot-alerts'
    send_resolved: true
    title: '{{ .CommonAnnotations.summary }}'
    text: '{{ .CommonAnnotations.description }}'

- name: 'pagerduty-emergency'
  pagerduty_configs:
  - service_key: ${PAGERDUTY_SERVICE_KEY}
    severity: 'critical'
    description: '{{ .CommonAnnotations.description }}'
```

## 🔍 Performance Monitoring

### Key Performance Indicators
```yaml
# KPIs to monitor
kpis:
  response_time:
    p95: < 500ms
    p99: < 1000ms
    average: < 300ms

  availability:
    target: 99.9%
    measurement: uptime

  error_rate:
    target: < 0.1%
    measurement: error percentage

  throughput:
    target: > 1000 messages/minute
    measurement: messages per minute

  concurrency:
    target: < 1000 active sessions
    measurement: simultaneous users
```

### Performance Dashboards
```json
// grafana/dashboard.json
{
  "title": "Chatbot Service Dashboard",
  "panels": [
    {
      "title": "Response Time",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "95th percentile"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "singlestat",
      "targets": [
        {
          "expr": "rate(chatbot_errors_total[5m]) / rate(chatbot_messages_total[5m]) * 100",
          "legendFormat": "Error Rate"
        }
      ]
    },
    {
      "title": "Active Sessions",
      "type": "gauge",
      "targets": [
        {
          "expr": "chatbot_active_sessions",
          "legendFormat": "Active Sessions"
        }
      ]
    }
  ]
}
```

## 🛠️ Operational Procedures

### Daily Checks
```bash
#!/bin/bash
# daily-checks.sh

# Check service health
curl -s http://localhost:3001/health | jq .

# Check error logs
tail -n 100 /var/log/chatbot/error.log | grep ERROR

# Check disk space
df -h /var/lib/chatbot

# Check memory usage
free -h

# Check service status
systemctl status chatbot-service
```

### Backup Procedures
```bash
#!/bin/bash
# backup-script.sh

# Database backup
pg_dump -U chatbot_user -h localhost -F c chatbot_db > /backup/chatbot_db_$(date +%Y%m%d).dump

# Log backup
tar -czf /backup/logs_$(date +%Y%m%d).tar.gz /var/log/chatbot/

# Configuration backup
tar -czf /backup/config_$(date +%Y%m%d).tar.gz /etc/chatbot/

# Upload to cloud storage
aws s3 cp /backup/ s3://chatbot-backups/ --recursive --exclude "*" --include "*.dump" --include "*.tar.gz"

# Cleanup old backups
find /backup/ -name "*.dump" -mtime +30 -delete
find /backup/ -name "*.tar.gz" -mtime +7 -delete
```

### Incident Response
```yaml
# incident-response.yaml
procedures:
  service_outage:
    steps:
      - check_health_endpoint
      - check_database_connection
      - check_redis_connection
      - check_logs_for_errors
      - restart_service_if_needed
      - escalate_if_unresolved

  high_error_rate:
    steps:
      - check_recent_deployments
      - analyze_error_patterns
      - check_dependencies
      - rollback_if_needed
      - increase_logging_verbosity

  performance_degradation:
    steps:
      - check_system_resources
      - analyze_slow_queries
      - check_external_dependencies
      - scale_resources_if_needed
```

## 📊 Reporting

### Daily Reports
```sql
-- Daily activity report
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_messages,
  COUNT(DISTINCT user_id) as active_users,
  AVG(response_time) as avg_response_time,
  SUM(CASE WHEN urgency = 'HIGH' THEN 1 ELSE 0 END) as urgent_messages
FROM messages 
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(timestamp);
```

### Weekly Performance Report
```sql
-- Weekly performance summary
SELECT 
  DATE_TRUNC('week', timestamp) as week,
  COUNT(*) as total_messages,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time,
  SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors,
  COUNT(DISTINCT user_id) as weekly_active_users
FROM messages 
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE_TRUNC('week', timestamp);
```

## 🔧 Troubleshooting Guide

### Common Issues
```markdown
## Database Connection Issues
**Symptoms**: 
- Health check failing for database
- High error rate for database operations

**Solutions**:
1. Check database service status: `systemctl status mysql`
2. Verify connection parameters in config
3. Check database logs: `/var/log/mysql/error.log`

## Redis Connection Issues
**Symptoms**:
- Session data not persisting
- Health check failing for Redis

**Solutions**:
1. Check Redis service status: `systemctl status redis`
2. Verify Redis memory usage: `redis-cli info memory`
3. Check connection limits: `redis-cli config get maxclients`

## High Response Times
**Symptoms**:
- Slow message processing
- High p95 response times

**Solutions**:
1. Check system resources: CPU, memory, disk I/O
2. Analyze slow database queries
3. Check external service dependencies (Ollama, n8n)
```

### Diagnostic Commands
```bash
# Check service status
systemctl status chatbot-service
journalctl -u chatbot-service -f

# Check database performance
pg_top -U chatbot_user -d chatbot_db
pg_stat_statements -U chatbot_user -d chatbot_db

# Check Redis performance
redis-cli info
redis-cli slowlog get

# Check network connectivity
curl -v http://localhost:11434/api/tags  # Ollama health
curl -v http://localhost:5678/health     # n8n health

# Monitor real-time traffic
tail -f /var/log/chatbot/service.log | grep -E "(ERROR|WARN)"
```

## 📋 Monitoring Checklist

### Daily Monitoring
- [ ] Service health status
- [ ] Error rate below 0.1%
- [ ] Response times within SLA
- [ ] Database connections healthy
- [ ] Disk space adequate
- [ ] Memory usage normal

### Weekly Maintenance  
- [ ] Log rotation working
- [ ] Backup successful
- [ ] Metrics storage adequate
- [ ] Alert rules validated
- [ ] Dashboard updated

### Monthly Review
- [ ] Performance trends analyzed
- [ ] Capacity planning updated
- [ ] Security patches applied
- [ ] Documentation updated
- [ ] Incident reviews completed

---
*Last updated: January 2024*
*Monitoring Stack: Prometheus + Grafana + Alertmanager*
*Logging Stack: ELK (Elasticsearch, Logstash, Kibana)*