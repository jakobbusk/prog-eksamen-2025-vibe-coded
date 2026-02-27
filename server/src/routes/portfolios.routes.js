const router = require('express').Router();
const controller = require('../controllers/portfolios.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/', controller.getPortfolios);
router.post('/', controller.createPortfolio);
router.get('/:id', controller.getPortfolio);
router.get('/:id/overview', controller.getPortfolioOverview);
router.delete('/:id', controller.deletePortfolio);

module.exports = router;
