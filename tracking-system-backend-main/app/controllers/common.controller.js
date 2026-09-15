const { validationResult } = require('express-validator')
const _ = require("lodash")
const controller = (service) => {
  return async (req, res, _next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() })
    }
    try {
      const response = await service({
        headers: req.headers,
        cookies: req.cookies,
        body: req.body,
        file: req.file ?? null,
        files: req.files ?? [],
        query: req.query,
        params: req.params,
        user: req.user,
        res,
      });
      res.status(200).json(response);
    } catch (error) {
      console.log('[ERROR]', error);
      const status = error.status ?? 500;
      const message = status >= 500
        ? 'Something went wrong. Please try again later.'
        : (error.message ?? 'Something went wrong');
      res.status(status).json({ message });
      console.log(error);
    }
  };
};

module.exports = controller;