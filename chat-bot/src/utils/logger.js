const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json } = format;

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'chatbot-service' },
  transports: [
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new transports.Console({
      format: format.simple()
    })
  ]
});

module.exports = logger;