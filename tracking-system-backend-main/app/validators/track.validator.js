const subscribeTrackUpdatesSchema = {
  email: {
    notEmpty: { errorMessage: 'Email is required' },
    isEmail: { errorMessage: 'Enter a valid email address' },
    normalizeEmail: {
      options: {
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
      },
    },
    trim: true,
  },
};

module.exports = {
  subscribeTrackUpdatesSchema,
};
