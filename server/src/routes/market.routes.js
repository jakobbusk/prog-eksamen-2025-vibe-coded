const router = require('express').Router();
const controller = require('../controllers/market.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/search', controller.searchSecurity);
router.get('/quote/:ticker', controller.getQuote);
router.get('/history/:ticker', controller.getHistory);
router.post('/refresh/:ticker', controller.refreshQuote);

module.exports = router;
