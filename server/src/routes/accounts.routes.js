const router = require('express').Router();
const controller = require('../controllers/accounts.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/', controller.getAccounts);
router.post('/', controller.createAccount);
router.get('/:id', controller.getAccount);
router.put('/:id', controller.updateAccount);
router.post('/:id/close', controller.closeAccount);
router.post('/:id/reopen', controller.reopenAccount);
router.post('/:id/deposit', controller.deposit);
router.post('/:id/withdraw', controller.withdraw);
router.get('/:id/transactions', controller.getTransactions);

module.exports = router;
