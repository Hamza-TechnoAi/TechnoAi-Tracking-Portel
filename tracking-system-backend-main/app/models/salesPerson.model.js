const { Schema, model } = require('mongoose');

const salesPersonSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Sales person name is required'],
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = model('SalesPerson', salesPersonSchema);
