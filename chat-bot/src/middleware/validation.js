const Joi = require('joi');

const chatMessageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  userId: Joi.string().required(),
  sessionId: Joi.string().optional(),
  language: Joi.string().valid('vi', 'en', 'fr', 'es').default('vi')
});

const validateChatMessage = (req, res, next) => {
  const { error } = chatMessageSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  
  next();
};

module.exports = { validateChatMessage };