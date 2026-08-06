let app;
let initError = null;

try {
  app = require('../backend/server.js');
} catch (err) {
  initError = err;
  console.error('❌ Failed to load backend server in Vercel API function:', err);
}

module.exports = (req, res) => {
  if (initError || !app) {
    return res.status(500).json({ 
      error: 'Backend server failed to initialize on Vercel.', 
      details: initError ? initError.message : 'App is null'
    });
  }

  // Ensure req.url retains /api prefix for Express routing
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }

  return app(req, res);
};
