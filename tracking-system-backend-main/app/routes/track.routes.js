const express = require('express');
const router = express.Router();
const { checkSchema } = require('express-validator');
const trackCtlr = require('../controllers/track.controller');
const { subscribeTrackUpdatesSchema } = require('../validators/track.validator');
const setupRoutes = require('./route.util');

const routes = [
  {
    method: 'get',
    path: '/:poNumber',
    middlewares: [],
    handler: trackCtlr.getByPoNumber,
  },
  {
    method: 'post',
    path: '/:poNumber/subscribe',
    middlewares: [checkSchema(subscribeTrackUpdatesSchema)],
    handler: trackCtlr.subscribe,
  },
];

setupRoutes(router, routes);

module.exports = router;
