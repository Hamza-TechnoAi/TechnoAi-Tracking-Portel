const { Router } = require('express');
const userRouter = require('./user.routes');
const trackRouter = require('./track.routes');
const purchaseOrderRouter = require('./purchaseOrder.routes');
const dashboardRouter = require('./dashboard.routes');
const salesPersonRouter = require('./salesPerson.routes');

const router = Router();

router.use('/users', userRouter);
router.use('/track', trackRouter);
router.use('/purchase-orders', purchaseOrderRouter);
router.use('/dashboard', dashboardRouter);
router.use('/sales-persons', salesPersonRouter);

module.exports = router;
