import handler from './api/affordability.js';

const req = {
  method: 'POST',
  body: {
    purchase_amount: 100,
    category: 'Shopping',
    merchant_name: 'amazon',
    purchase_date: '2026-05-02'
  }
};

const res = {
  setHeader: (k, v) => console.log('setHeader', k, v),
  status: (code) => {
    console.log('status', code);
    return {
      json: (data) => console.log('json', data),
      end: () => console.log('end')
    };
  }
};

handler(req, res).catch(console.error);
