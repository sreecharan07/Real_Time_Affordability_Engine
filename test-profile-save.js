import handler from './api/profile.js';

const req = {
  method: 'POST',
  body: {
    monthly_income: 3000,
    current_balance: 1000,
    savings_goal: 200,
    safety_buffer: 500,
    payday_date: 1
  }
};

const res = {
  setHeader: () => {},
  status: (code) => {
    console.log('Status:', code);
    return {
      json: (data) => console.log('JSON:', data),
      end: () => console.log('End')
    };
  }
};

handler(req, res);
