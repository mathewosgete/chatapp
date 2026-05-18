const { register, profile, getuserByEmail, getUserByEmailOrUsername, getAlluser, userById } = require('./user.service');
const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = {
    createUser: (req, res) => {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                message: "Request body is missing or not JSON. Make sure to set Content-Type: application/json."
            });
        }

        const { userName, firstName, lastName, email, password } = req.body;

        if (!userName || !firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        pool.query(
            `SELECT * FROM registration WHERE user_email = ?`,
            [email],
            (error, results) => {
                if (error) {
                    return res.status(500).json({ message: "Database error", error: error.message });
                }

                if (results.length > 0) {
                    return res.status(400).json({ message: "Email already exists" });
                }

                const salt = bcrypt.genSaltSync();
                const hashedPassword = bcrypt.hashSync(password, salt);

                // Pass normalized data object to service
                const userData = {
                    user_name: userName,
                    first_name: firstName,
                    last_name: lastName,
                    user_email: email,
                    user_password: hashedPassword
                };

                register(userData, (err, results) => {
                    if (err) {
                        return res.status(500).json({ message: "Database error", error: err.message });
                    }

                    pool.query(
                        `SELECT user_id FROM registration WHERE user_email = ?`,
                        [email],
                        (error, results) => {
                            if (error) {
                                return res.status(500).json({ message: "Database error", error: error.message });
                            }

                            userData.userId = results[0].user_id;

                            profile(userData, (err, profileResult) => {
                                if (err) {
                                    return res.status(500).json({ message: "Database error", error: err.message });
                                }

                                return res.status(201).json({
                                    message: "User registered successfully",
                                    data: profileResult
                                });
                            });
                        }
                    );
                });
            }
        );
    },
    getUser: (req, res) => {
        getAlluser((err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "database connection error"
                });
            }

            return res.status(200).json({
                data: results
            });
        });
    },
    getUserById: (req, res) => {
        const id = req.id; // from token

        userById(id, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "database connection error"
                });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            return res.status(200).json({
                data: results
            });
        });
    },
    login: (req, res) => {
        const { email, password } = req.body;

        getUserByEmailOrUsername(email, (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Database error" });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({
                    message: "No user found with this email or username"
                });
            }

            const user = results[0];

            if (!user.user_password) {
                return res.status(500).json({
                    message: "User password missing in DB"
                });
            }

            const isMatch = bcrypt.compareSync(password, user.user_password);

            if (!isMatch) {
                return res.status(401).json({
                    message: "Invalid password"
                });
            }

            const token = jwt.sign(
                { userId: user.user_id },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            return res.json({
                token,
                user: {
                    id: user.user_id,
                    display_name: user.user_name
                }
            });
        });
    }
}

