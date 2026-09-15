const { Schema, model } = require('mongoose');

const activityHistorySchema = new Schema(
  {
    purchaseOrder: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    field: {
      type: String,
      default: '',
      trim: true,
    },
    oldValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    performedByName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = model('ActivityHistory', activityHistorySchema);
