const router = require('express').Router();
const auth = require('../middleware/auth');
const { createUser, getUser, getUserById, login} = require('./user.controller');

console.log('userRouter loaded');

router.post("/", createUser);
router.get("/all", getUser);
router.get("/id",auth, getUserById);
router.post("/login", login);


module.exports = router;
