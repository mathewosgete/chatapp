const pool = require('../../config/database');

module.exports = {
    register: (data, callBack) => {
        pool.query(
            `INSERT INTO registration(user_name, user_email, user_password) VALUES(?,?,?)`,
            [
                data.user_name,
                data.user_email,
                data.user_password
            ],
            (error, results) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },

    profile: (data, callBack) => {
        pool.query(
            `INSERT INTO Profiler(user_id, first_name, last_name) VALUES(?, ?, ?)`,
            [data.userId, data.first_name, data.last_name],
            (error, results) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
userById: (id, callBack) => {
    pool.query(
        `SELECT registration.user_id, user_name, user_email, first_name, last_name
         FROM registration
         LEFT JOIN Profiler
         ON registration.user_id = Profiler.user_id
         WHERE registration.user_id = ?`,
        [id],
        (error, results) => {
            if (error) {
                console.log("DB ERROR:", error);
                return callBack(error);
            }
            return callBack(null, results);
        }
    );
},

 getuserByEmail: (email, callBack) => {
    pool.query(
        `SELECT * FROM registration WHERE user_email = ?`,
        [email],
        (error, results) => {
            if (error) return callBack(error);
            return callBack(null, results); // ✅ return array
        }
    );
},

getUserByEmailOrUsername: (identifier, callBack) => {
    pool.query(
        `SELECT * FROM registration WHERE user_email = ? OR user_name = ?`,
        [identifier, identifier],
        (error, results) => {
            if (error) return callBack(error);
            return callBack(null, results);
        }
    );
},

   getAlluser: (callBack) => {
    pool.query(
        `SELECT registration.user_id, registration.user_name, registration.user_email
         FROM registration
         LEFT JOIN Profiler 
         ON registration.user_id = Profiler.user_id`,
        [],
        (error, results) => {
            if (error) {
                return callBack(error);
            }
            return callBack(null, results);
        }
    );
}
};