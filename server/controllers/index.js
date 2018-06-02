var router = require('express').Router();


router.use('/user', require('./users.js'));


module.exports = router;