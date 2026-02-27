const router = require('express').Router();
const controller = require('../controllers/trades.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/search', controller.searchSecurities);
router.get('/', controller.getTrades);
router.post('/', controller.createTrade);

module.exports = router;
