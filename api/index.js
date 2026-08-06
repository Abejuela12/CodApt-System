const app = require('../backend/server.js');

module.exports = (req, res) => {
  // Fix URL routing for Express on Vercel Serverless Functions
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};
