const express = require('express');
const router = express.Router();
const { checkSchema } = require('express-validator');
const purchaseOrderCtlr = require('../controllers/purchaseOrder.controller');
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updateLineItemSchema,
  createLineItemSchema,
} = require('../validators/purchaseOrder.validator');
const { STAFF_ROLES, EDIT_ROLES } = require('../constants');
const setupRoutes = require('./route.util');

const routes = [
  {
    method: 'post',
    path: '/',
    middlewares: [
      authenticateUser,
      authorizeUser(EDIT_ROLES),
      checkSchema(createPurchaseOrderSchema),
    ],
    handler: purchaseOrderCtlr.create,
  },
  {
    method: 'get',
    path: '/',
    middlewares: [authenticateUser, authorizeUser(STAFF_ROLES)],
    handler: purchaseOrderCtlr.list,
  },
  {
    method: 'get',
    path: '/filter-options',
    middlewares: [authenticateUser, authorizeUser(STAFF_ROLES)],
    handler: purchaseOrderCtlr.filterOptions,
  },
  {
    method: 'get',
    path: '/search',
    middlewares: [authenticateUser, authorizeUser(STAFF_ROLES)],
    handler: purchaseOrderCtlr.search,
  },
  {
    method: 'get',
    path: '/:id',
    middlewares: [authenticateUser, authorizeUser(STAFF_ROLES)],
    handler: purchaseOrderCtlr.getById,
  },
  {
    method: 'put',
    path: '/:id',
    middlewares: [
      authenticateUser,
      authorizeUser(EDIT_ROLES),
      checkSchema(updatePurchaseOrderSchema),
    ],
    handler: purchaseOrderCtlr.update,
  },
  {
    method: 'delete',
    path: '/:id',
    middlewares: [authenticateUser, authorizeUser(EDIT_ROLES)],
    handler: purchaseOrderCtlr.remove,
  },
  {
    method: 'post',
    path: '/:id/lines',
    middlewares: [
      authenticateUser,
      authorizeUser(EDIT_ROLES),
      checkSchema(createLineItemSchema),
    ],
    handler: purchaseOrderCtlr.addLine,
  },
  {
    method: 'put',
    path: '/:id/lines/:lineNumber',
    middlewares: [
      authenticateUser,
      authorizeUser(EDIT_ROLES),
      checkSchema(updateLineItemSchema),
    ],
    handler: purchaseOrderCtlr.updateLine,
  },
  {
    method: 'delete',
    path: '/:id/lines/:lineNumber',
    middlewares: [authenticateUser, authorizeUser(EDIT_ROLES)],
    handler: purchaseOrderCtlr.removeLine,
  },
  {
    method: 'get',
    path: '/:id/activity',
    middlewares: [authenticateUser, authorizeUser(STAFF_ROLES)],
    handler: purchaseOrderCtlr.getActivity,
  },
];

setupRoutes(router, routes);

module.exports = router;
