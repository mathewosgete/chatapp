const mysql = require("mysql2");

// Initial connection to ensure the database exists
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  queueLimit: 0,
});

const registration = `
CREATE TABLE IF NOT EXISTS registration(
    user_id INT AUTO_INCREMENT,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id)
)`;

const Profiler = `
CREATE TABLE IF NOT EXISTS Profiler(
    profile_id INT AUTO_INCREMENT,
    user_id INT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (profile_id),
    FOREIGN KEY (user_id) REFERENCES registration(user_id)
)`;

const questions = `
CREATE TABLE IF NOT EXISTS questions(
    question_id INT AUTO_INCREMENT,
    question_text VARCHAR(500) NOT NULL,
    question_description TEXT NOT NULL,
    question_code_block TEXT,
    tags VARCHAR(255),
    post_id VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (question_id),
    UNIQUE KEY (post_id),
    FOREIGN KEY (user_id) REFERENCES registration(user_id)
)`;

const answers = `
CREATE TABLE IF NOT EXISTS answers(
    answer_id INT AUTO_INCREMENT,
    answer TEXT NOT NULL,
    answer_code TEXT,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (answer_id),
    FOREIGN KEY (user_id) REFERENCES registration(user_id),
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
)`;

// Synchronized initialization
const initialize = () => {
  connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DB}\``, (err) => {
    if (err) {
      console.error("Database creation/check failed:", err.message);
      connection.end();
      return;
    }
    console.log(`Database '${process.env.MYSQL_DB}' ensured`);
    connection.end();

    // Now check pool connection and create tables
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("Database connection failed:", err.message);
        return;
      }
      console.log("Database connected and pool ready");
      conn.release();

      // Create tables sequentially
      const tables = [
        { name: "registration", query: registration },
        { name: "Profiler", query: Profiler },
        { name: "questions", query: questions },
        { name: "answers", query: answers },
      ];

      let promise = Promise.resolve();
      tables.forEach((table) => {
        promise = promise.then(() => {
          return new Promise((resolve) => {
            pool.query(table.query, (err) => {
              if (err) {
                console.error(`${table.name} table creation failed:`, err.message);
              } else {
                console.log(`${table.name} table ensured`);
              }
              resolve();
            });
          });
        });
      });
    });
  });
};

initialize();

module.exports = pool;