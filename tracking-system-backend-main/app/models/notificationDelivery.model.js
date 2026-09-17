const { Schema, model } = require('mongoose');

// Claim before SMTP: an ambiguous SMTP failure must never cause a duplicate send.
const schema = new Schema({
  eventKey: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['claimed', 'sent', 'failed'], default: 'claimed' },
}, { timestamps: true });
schema.index({ eventKey: 1, email: 1 }, { unique: true });
module.exports = model('NotificationDelivery', schema);
