const express = require('express');
const router = express.Router();
const { checkSchema } = require('express-validator');
const salesPersonCtlr = require('../controllers/salesPerson.controller');
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
const { STAFF_ROLES, ADMIN_ROLES } = require('../constants');
const {
  createSalesPersonSchema,
  updateSalesPersonSchema,
} = require('../validators/salesPerson.validator');

const routes = [
  {
    method: 'get',
    path: '/',
    middlewares: [authenticateUser, authorizeUser(STAFF_ROLES)],
    handler: salesPersonCtlr.list,
  },
  {
    method: 'post',
    path: '/',
    middlewares: [
      authenticateUser,
      authorizeUser(ADMIN_ROLES),
      checkSchema(createSalesPersonSchema),
    ],
    handler: salesPersonCtlr.create,
  },
  {
    method: 'put',
    path: '/:id',
    middlewares: [
      authenticateUser,
      authorizeUser(ADMIN_ROLES),
      checkSchema(updateSalesPersonSchema),
    ],
    handler: salesPersonCtlr.update,
  },
  {
    method: 'delete',
    path: '/:id',
    middlewares: [authenticateUser, authorizeUser(ADMIN_ROLES)],
    handler: salesPersonCtlr.remove,
  },
];

setupRoutes(router, routes);

module.exports = router;
