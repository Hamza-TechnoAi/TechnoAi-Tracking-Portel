const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const { authenticateUser } = require('../middlewares/auth');
const { STAFF_ROLES } = require('../constants');

router.use(authenticateUser);
// Consult current account state; a stale JWT must not bypass revocation.
router.use(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role isApproved isBlocked');
    if (!user || !user.isApproved || user.isBlocked || !STAFF_ROLES.includes(user.role)) {
      return res.status(403).json({ message: 'Staff access required' });
    }
    next();
  } catch (error) { next(error); }
});
router.get('/', async (req, res, next) => {
  try {
    const filter = { recipient: req.user.id };
    const [data, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1, _id: -1 }).limit(20)
        .select('purchaseOrder message type readAt createdAt'),
      Notification.countDocuments({ ...filter, readAt: null }),
    ]);
    res.json({ data, unreadCount });
  } catch (error) { next(error); }
});
router.patch('/:id/read', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid notification ID' });
    const filter = { _id: req.params.id, recipient: req.user.id };
    const notification = await Notification.findOne(filter);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    await Notification.updateOne({ ...filter, readAt: null }, { $set: { readAt: new Date() } });
    res.json({ message: 'Notification marked as read' });
  } catch (error) { next(error); }
});
router.use((error, req, res, next) => {
  console.error('[notifications]', error.name);
  res.status(500).json({ message: 'Unable to load or update notifications' });
});
module.exports = router;
