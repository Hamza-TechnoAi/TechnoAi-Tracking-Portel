const ActivityHistory = require('../models/activityHistory.model');
const User = require('../models/user.model');
const { buildStaffName } = require('./purchaseOrder.helpers');

const resolvePerformer = async (user) => {
  if (!user?.id) return user;

  const dbUser = await User.findById(user.id).select('firstName lastName email');
  return dbUser || user;
};

const logActivity = async ({
  purchaseOrderId,
  action,
  description = '',
  field = '',
  oldValue,
  newValue,
  user,
}) => {
  const performer = await resolvePerformer(user);

  await ActivityHistory.create({
    purchaseOrder: purchaseOrderId,
    action,
    description,
    field,
    oldValue,
    newValue,
    performedBy: user?.id,
    performedByName: buildStaffName(performer),
  });
};

module.exports = logActivity;
