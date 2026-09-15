/**
 * Public-facing PO statuses shown in the tracking table.
 */
export const ITEM_STATUSES = [
  'Ordered',
  'Processing',
  'Received',
  'Delivered',
  'In Transit',
];

/** Backend-aligned line statuses for dashboard PO management */
export const LINE_STATUSES = [
  'Processing',
  'Ready to Ship from Supplier',
  'In Transit',
  'In Inventory',
  'Ready for Delivery',
  'Delivered',
];

export const LINE_CURRENCIES = ['AED', 'USD', 'CNY'];

export const PO_STATUSES = ['Open', 'Closed'];

/**
 * Demo purchase orders — public display fields only.
 * Full invoice/admin fields will live in the backend later.
 */
export const DEMO_PURCHASE_ORDERS = [
  {
    poNumber: '4500002233',
    poStatusPercent: 75,
    poEta: '2026-08-04',
    items: [
      {
        lineNo: 10,
        description: 'CBG136 CR2032 RTC Battery w/ 3-pin',
        quantity: 1,
        status: 'Ordered',
        eta: '2026-07-27',
      },
      {
        lineNo: 20,
        description: 'CBG313 CAN IO Breakout Cable (Flying',
        quantity: 20,
        status: 'Processing',
        eta: '2026-07-22',
      },
      {
        lineNo: 30,
        description: 'CBG312 MISC IO Breakout Cable (Flying',
        quantity: 12,
        status: 'Received',
        eta: '2026-07-10',
      },
      {
        lineNo: 40,
        description: 'XHG307 Liquid Cooling Block for the NVI',
        quantity: 9,
        status: 'Delivered',
        eta: '2026-07-03',
      },
      {
        lineNo: 50,
        description: 'AGX202 Rogue Carrier Board for NVIDIA',
        quantity: 15,
        status: 'In Transit',
        eta: '2026-08-04',
      },
      {
        lineNo: 60,
        description: 'Freight and Handling Charges',
        quantity: 1,
        status: 'Processing',
        eta: '2026-08-04',
      },
    ],
  },
  {
    poNumber: '4500003055',
    poStatusPercent: 42,
    poEta: '2026-06-30',
    items: [
      {
        lineNo: 10,
        description: 'CBG136 CR2032 RTC Battery w/ 3-pin',
        quantity: 1,
        status: 'Delivered',
        eta: '2026-06-28',
      },
      {
        lineNo: 20,
        description: 'CBG313 CAN IO Breakout Cable (Flying',
        quantity: 1,
        status: 'In Transit',
        eta: '2026-06-30',
      },
      {
        lineNo: 30,
        description: 'CBG312 MISC IO Breakout Cable (Flying',
        quantity: 1,
        status: 'Processing',
        eta: '2026-06-30',
      },
      {
        lineNo: 40,
        description: 'XHG307 Liquid Cooling Block for the NVI',
        quantity: 1,
        status: 'Ordered',
        eta: '2026-06-30',
      },
    ],
  },
];

export const DEMO_SEARCH_DELAY_MS = 600;
