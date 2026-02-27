const dashboardService = require('../services/dashboard.service');

async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboard(req.user.id);
    res.json({ data });
  } catch (err) { next(err); }
}

module.exports = { getDashboard };
