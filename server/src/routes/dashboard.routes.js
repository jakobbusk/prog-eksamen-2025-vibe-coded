const router = require('express').Router();
const controller = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/', controller.getDashboard);

module.exports = router;
