const { Schema, model } = require('mongoose');

const schema = new Schema({
  eventKey: { type: String, required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  readAt: { type: Date, default: null },
}, { timestamps: true });
schema.index({ eventKey: 1, recipient: 1 }, { unique: true });
schema.index({ recipient: 1, createdAt: -1 });
schema.index({ recipient: 1, readAt: 1 });
module.exports = model('Notification', schema);
