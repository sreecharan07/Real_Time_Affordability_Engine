import handler from './api/insights.js';

const req = {
  method: 'GET'
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
