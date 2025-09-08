const Rule = require('../rule-engine/storage/Rule');

const createRuleTable = async () => {
  try {
    await Rule.sync({ force: process.env.NODE_ENV === 'development' });
    console.log('Rule table created successfully');
  } catch (error) {
    console.error('Error creating rule table:', error);
    throw error;
  }
};

module.exports = { createRuleTable };