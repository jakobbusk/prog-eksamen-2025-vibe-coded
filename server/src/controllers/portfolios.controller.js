const portfoliosService = require('../services/portfolios.service');

async function getPortfolios(req, res, next) {
  try {
    const portfolios = await portfoliosService.getPortfolios(req.user.id);
    res.json({ data: portfolios });
  } catch (err) { next(err); }
}

async function getPortfolio(req, res, next) {
  try {
    const portfolio = await portfoliosService.getPortfolio(parseInt(req.params.id), req.user.id);
    res.json({ data: portfolio });
  } catch (err) { next(err); }
}

async function createPortfolio(req, res, next) {
  try {
    const portfolio = await portfoliosService.createPortfolio(req.user.id, req.body);
    res.status(201).json({ data: portfolio });
  } catch (err) { next(err); }
}

async function getPortfolioOverview(req, res, next) {
  try {
    const overview = await portfoliosService.getPortfolioOverview(parseInt(req.params.id), req.user.id);
    res.json({ data: overview });
  } catch (err) { next(err); }
}

async function deletePortfolio(req, res, next) {
  try {
    await portfoliosService.deletePortfolio(parseInt(req.params.id), req.user.id);
    res.json({ data: { message: 'Portfolio deleted' } });
  } catch (err) { next(err); }
}

module.exports = { getPortfolios, getPortfolio, createPortfolio, getPortfolioOverview, deletePortfolio };
