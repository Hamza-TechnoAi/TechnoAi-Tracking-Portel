require('dotenv').config();

const mongoose = require('mongoose');
const PurchaseOrder = require('../app/models/purchaseOrder.model');
const { normalizeLineItems, syncPurchaseOrderState } = require('../app/utils/purchaseOrder.helpers');

const mapDemoStatus = (status) => {
  const statusMap = {
    Ordered: 'Processing',
    Processing: 'Processing',
    Received: 'In Inventory',
    Delivered: 'Delivered',
    'In Transit': 'In Transit',
  };

  return statusMap[status] || 'Processing';
};

const demoPurchaseOrders = [
  {
    poNumber: '4500002233',
    soNumber: 'SO-4500002233',
    poDate: new Date('2026-06-01'),
    overallPoEta: new Date('2026-08-04'),
    clientName: 'Demo Client A',
    salesPerson: 'TechnoAi Sales',
    contactPerson: 'John Smith',
    contactPersonEmail: 'john.smith@democlienta.com',
    subject: 'Hardware components shipment',
    lines: [
      { lineNumber: 10, description: 'CBG136 CR2032 RTC Battery w/ 3-pin', quantity: 1, unitPrice: 55, currency: 'USD', status: 'Processing', eta: '2026-07-27' },
      { lineNumber: 20, description: 'CBG313 CAN IO Breakout Cable (Flying', quantity: 20, unitPrice: 55, currency: 'USD', status: 'Processing', eta: '2026-07-22' },
      { lineNumber: 30, description: 'CBG312 MISC IO Breakout Cable (Flying', quantity: 12, unitPrice: 55, currency: 'USD', status: 'In Inventory', eta: '2026-07-10' },
      { lineNumber: 40, description: 'XHG307 Liquid Cooling Block for the NVI', quantity: 9, unitPrice: 55, currency: 'USD', status: 'Delivered', eta: '2026-07-03' },
      { lineNumber: 50, description: 'AGX202 Rogue Carrier Board for NVIDIA', quantity: 15, unitPrice: 55, currency: 'USD', status: 'In Transit', eta: '2026-08-04', shipmentTrackingLink: 'https://example.com/track/AGX202' },
      { lineNumber: 60, description: 'Freight and Handling Charges', quantity: 1, unitPrice: 55, currency: 'USD', status: 'Processing', eta: '2026-08-04' },
    ],
  },
  {
    poNumber: '4500003055',
    soNumber: 'SO-4500003055',
    poDate: new Date('2026-05-15'),
    overallPoEta: new Date('2026-06-30'),
    clientName: 'Demo Client B',
    salesPerson: 'TechnoAi Sales',
    contactPerson: 'Jane Doe',
    contactPersonEmail: 'jane.doe@democlientb.com',
    subject: 'Accessories shipment',
    lines: [
      { lineNumber: 10, description: 'CBG136 CR2032 RTC Battery w/ 3-pin', quantity: 1, unitPrice: 55, currency: 'USD', status: 'Delivered', eta: '2026-06-28' },
      { lineNumber: 20, description: 'CBG313 CAN IO Breakout Cable (Flying', quantity: 1, unitPrice: 55, currency: 'USD', status: 'In Transit', eta: '2026-06-30' },
      { lineNumber: 30, description: 'CBG312 MISC IO Breakout Cable (Flying', quantity: 1, unitPrice: 55, currency: 'USD', status: 'Processing', eta: '2026-06-30' },
      { lineNumber: 40, description: 'XHG307 Liquid Cooling Block for the NVI', quantity: 1, unitPrice: 55, currency: 'USD', status: 'Processing', eta: '2026-06-30' },
    ],
  },
];

const seed = async () => {
  if (!process.env.MONGODB_CLOUD_URI) {
    console.error('MONGODB_CLOUD_URI is required');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_CLOUD_URI);
  console.log('Connected to MongoDB');

  for (const demoPo of demoPurchaseOrders) {
    const existing = await PurchaseOrder.findOne({ poNumber: demoPo.poNumber });

    if (existing) {
      console.log(`Skipping ${demoPo.poNumber} (already exists)`);
      continue;
    }

    const purchaseOrder = new PurchaseOrder({
      ...demoPo,
      lines: normalizeLineItems(
        demoPo.lines.map((line) => ({
          ...line,
          status: mapDemoStatus(line.status),
        })),
      ),
    });

    syncPurchaseOrderState(purchaseOrder);
    await purchaseOrder.save();
    console.log(`Created ${demoPo.poNumber}`);
  }

  await mongoose.disconnect();
  console.log('Seed complete');
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
