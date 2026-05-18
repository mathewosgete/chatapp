const router = require('express').Router();
const auth = require('../middleware/auth');
const { getQuestions, getDuplicates, getQuestion, postQuestion, postAnswer } = require('./question.controller');

console.log('questionRouter loaded');

router.get('/', auth, getQuestions);
router.get('/duplicates', auth, getDuplicates);
router.get('/:questionId', auth, getQuestion);
router.post('/', auth, postQuestion);
router.post('/:questionId/answers', auth, postAnswer);

module.exports = router;
