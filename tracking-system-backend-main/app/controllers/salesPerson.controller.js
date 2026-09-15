const SalesPerson = require('../models/salesPerson.model');
const PurchaseOrder = require('../models/purchaseOrder.model');
const returnError = require('./dto.service');

const normalizeName = (name = '') => name.trim().replace(/\s+/g, ' ');

const seedFromPurchaseOrdersIfEmpty = async () => {
  const count = await SalesPerson.countDocuments();
  if (count > 0) return;

  const names = await PurchaseOrder.distinct('salesPerson');
  const uniqueNames = [...new Set(names.map(normalizeName).filter(Boolean))];
  if (uniqueNames.length === 0) return;

  await SalesPerson.insertMany(
    uniqueNames.map((name) => ({ name, isActive: true })),
    { ordered: false },
  ).catch(() => {});
};

const salesPersonCtlr = {};

salesPersonCtlr.list = async ({ query }) => {
  await seedFromPurchaseOrdersIfEmpty();

  const filter = {};
  if (query.activeOnly === 'true') {
    filter.isActive = true;
  }

  const salesPersons = await SalesPerson.find(filter).sort({ name: 1 });

  return {
    message: 'Sales persons fetched successfully',
    data: salesPersons,
  };
};

salesPersonCtlr.create = async ({ body }) => {
  const name = normalizeName(body.name);
  if (!name) {
    throw returnError(400, 'Sales person name is required');
  }

  const existing = await SalesPerson.findOne({
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  });
  if (existing) {
    throw returnError(400, 'A sales person with this name already exists');
  }

  const salesPerson = await SalesPerson.create({ name, isActive: true });

  return {
    message: 'Sales person created successfully',
    data: salesPerson,
  };
};

salesPersonCtlr.update = async ({ params, body }) => {
  const salesPerson = await SalesPerson.findById(params.id);
  if (!salesPerson) {
    throw returnError(404, 'Sales person not found');
  }

  const previousName = salesPerson.name;

  if (body.name !== undefined) {
    const name = normalizeName(body.name);
    if (!name) {
      throw returnError(400, 'Sales person name is required');
    }

    const duplicate = await SalesPerson.findOne({
      _id: { $ne: salesPerson._id },
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (duplicate) {
      throw returnError(400, 'A sales person with this name already exists');
    }

    salesPerson.name = name;
  }

  if (body.isActive !== undefined) {
    salesPerson.isActive = Boolean(body.isActive);
  }

  await salesPerson.save();

  if (body.name !== undefined && previousName !== salesPerson.name) {
    await PurchaseOrder.updateMany(
      { salesPerson: previousName },
      { $set: { salesPerson: salesPerson.name } },
    );
  }

  return {
    message: 'Sales person updated successfully',
    data: salesPerson,
  };
};

salesPersonCtlr.remove = async ({ params }) => {
  const salesPerson = await SalesPerson.findById(params.id);
  if (!salesPerson) {
    throw returnError(404, 'Sales person not found');
  }

  await salesPerson.deleteOne();

  return {
    message: 'Sales person deleted successfully',
    data: { id: params.id },
  };
};

module.exports = salesPersonCtlr;
module.exports.seedFromPurchaseOrdersIfEmpty = seedFromPurchaseOrdersIfEmpty;
