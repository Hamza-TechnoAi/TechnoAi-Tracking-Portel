const { Schema, model } = require('mongoose');

const poSubscriptionSchema = new Schema(
  {
    poNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true },
);

poSubscriptionSchema.index({ poNumber: 1, email: 1 }, { unique: true });

module.exports = model('PoSubscription', poSubscriptionSchema);
