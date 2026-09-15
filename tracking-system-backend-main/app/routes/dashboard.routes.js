const express = require('express');
const router = express.Router();
const dashboardCtlr = require('../controllers/dashboard.controller');
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const { STAFF_ROLES } = require('../constants');
const setupRoutes = require('./route.util');

const routes = [
  {
    method: 'get',
    path: '/summary',
    middlewares: [authenticateUser, authorizeUser(STAFF_ROLES)],
    handler: dashboardCtlr.summary,
  },
];

setupRoutes(router, routes);

module.exports = router;
