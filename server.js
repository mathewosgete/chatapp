require('dotenv').config();
const pool = require('./server/config/database.js');
const express = require('express');
const cors = require('cors');
const userRouter = require('./server/api/users/user.router');
const questionRouter = require('./server/api/questions/question.router');

const app = express();
const host = '127.0.0.1';
const port = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRouter);
app.use('/api/questions', questionRouter);

app.listen(port, host, () => console.log(`Server running at http://${host}:${port}`));