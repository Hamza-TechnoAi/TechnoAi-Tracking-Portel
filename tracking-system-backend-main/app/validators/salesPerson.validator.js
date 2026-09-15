const createSalesPersonSchema = {
  name: {
    trim: true,
    notEmpty: { errorMessage: 'Sales person name is required' },
    isLength: {
      options: { min: 2, max: 80 },
      errorMessage: 'Name must be between 2 and 80 characters',
    },
  },
};

const updateSalesPersonSchema = {
  name: {
    optional: true,
    trim: true,
    notEmpty: { errorMessage: 'Sales person name is required' },
    isLength: {
      options: { min: 2, max: 80 },
      errorMessage: 'Name must be between 2 and 80 characters',
    },
  },
  isActive: {
    optional: true,
    isBoolean: { errorMessage: 'isActive must be a boolean' },
  },
};

module.exports = {
  createSalesPersonSchema,
  updateSalesPersonSchema,
};
