const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const RuleService = require('../src/rule-engine/storage/RuleService');
const logger = require('../src/utils/logger');
const { Sequelize } = require('sequelize');
const databaseSync = require('../src/utils/databaseSync');

const medicalRules = [
  {
    id: 'symptom_headache_en',
    name: 'Symptom: Headache (EN)',
    description: 'Provides advice for headache symptoms.',
    priority: 3,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['headache', 'head ache', 'my head hurts']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'If you have a headache, try to rest in a quiet, dark room, and drink water. Over-the-counter pain relievers can help. If the headache is severe or persistent, please consult a doctor.',
          urgency: 'NORMAL'
        }
      }
    ],
    language: 'en',
    enabled: true
  },
  {
    id: 'symptom_headache_vi',
    name: 'Triệu chứng: Đau đầu (VI)',
    description: 'Cung cấp lời khuyên cho triệu chứng đau đầu.',
    priority: 3,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['đau đầu', 'nhức đầu']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'Nếu bạn bị đau đầu, hãy thử nghỉ ngơi trong phòng yên tĩnh, tối và uống nước. Thuốc giảm đau không kê đơn có thể giúp ích. Nếu đau đầu dữ dội hoặc kéo dài, vui lòng tham khảo ý kiến bác sĩ.',
          urgency: 'NORMAL'
        }
      }
    ],
    language: 'vi',
    enabled: true
  },
  {
    id: 'symptom_sore_throat_en',
    name: 'Symptom: Sore Throat (EN)',
    description: 'Provides advice for sore throat symptoms.',
    priority: 2,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['sore throat', 'throat hurts', 'scratchy throat']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'For a sore throat, gargle with warm salt water, drink warm liquids like tea with honey, and rest your voice. If symptoms worsen or persist, see a doctor.',
          urgency: 'NORMAL'
        }
      }
    ],
    language: 'en',
    enabled: true
  },
  {
    id: 'symptom_sore_throat_vi',
    name: 'Triệu chứng: Đau họng (VI)',
    description: 'Cung cấp lời khuyên cho triệu chứng đau họng.',
    priority: 2,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['đau họng', 'rát họng', 'viêm họng']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'Để giảm đau họng, hãy súc miệng bằng nước muối ấm, uống đồ uống ấm như trà mật ong và nghỉ ngơi. Nếu các triệu chứng trở nên tồi tệ hơn hoặc kéo dài, hãy đi khám bác sĩ.',
          urgency: 'NORMAL'
        }
      }
    ],
    language: 'vi',
    enabled: true
  }
];

const seedRules = async (ruleServiceInstance) => {
  try {
    logger.info('Seeding medical rules...');
    for (const ruleData of medicalRules) {
      const existingRule = await ruleServiceInstance.getRuleById(ruleData.id);
      if (existingRule) {
        await ruleServiceInstance.updateRule(ruleData.id, ruleData);
        logger.info(`Rule updated: ${ruleData.name}`);
      } else {
        await ruleServiceInstance.createRule(ruleData);
        logger.info(`Rule created: ${ruleData.name}`);
      }
    }
    logger.info('Medical rules seeded successfully!');
  } catch (error) {
    logger.error('Failed to seed medical rules:', error);
    throw error;
  }
};

const run = async () => {
  let sequelize;
  try {
    const dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      dialect: 'mysql',
      logging: (msg) => logger.debug(msg)
    };
    sequelize = new Sequelize(dbConfig);
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    await databaseSync.syncDatabase(); // Ensure all models are synced (including Rule model)

    const ruleService = new RuleService();
    await seedRules(ruleService);
  } catch (error) {
    logger.error('Error during rule generation script execution:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      logger.info('Database connection closed.');
    }
    process.exit(0);
  }
};

if (require.main === module) {
  run();
}