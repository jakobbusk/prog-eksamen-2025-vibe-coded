const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', auth, controller.logout);
router.put('/password', auth, controller.changePassword);

module.exports = router;
