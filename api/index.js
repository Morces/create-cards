// Statically require endpoints so Vercel's analyzer bundles them
require('../endpoints/creator-cards/create');
require('../endpoints/creator-cards/get');
require('../endpoints/creator-cards/delete');
require('../endpoints/system/health');

const app = require('../app');

module.exports = app;
