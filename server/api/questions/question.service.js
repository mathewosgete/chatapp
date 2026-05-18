const pool = require('../../config/database');

module.exports = {
    getAllQuestions: (searchQuery, callBack) => {
        if (typeof searchQuery === 'function') {
            callBack = searchQuery;
            searchQuery = null;
        }

        let sql = `
            SELECT q.question_id, q.question_text, q.question_description, q.question_code_block,
                    q.tags, q.post_id, q.created_at,
                    r.user_name, r.user_id,
                    COUNT(a.answer_id) AS answer_count
             FROM questions q
             LEFT JOIN registration r ON q.user_id = r.user_id
             LEFT JOIN answers a ON q.question_id = a.question_id
        `;
        
        let conditions = [];
        let params = [];

        if (searchQuery && searchQuery.trim()) {
            const queryStr = searchQuery.trim();
            
            // 1. Parse tag search: [tag]
            const tagRegex = /\[([^\]]+)\]/g;
            let match;
            let tags = [];
            let cleanQuery = queryStr;
            while ((match = tagRegex.exec(queryStr)) !== null) {
                tags.push(match[1].toLowerCase());
                cleanQuery = cleanQuery.replace(match[0], "");
            }
            
            // 2. Parse user search: user:username
            const userRegex = /\buser:(\S+)/i;
            const userMatch = userRegex.exec(cleanQuery);
            let userFilter = null;
            if (userMatch) {
                userFilter = userMatch[1].toLowerCase();
                cleanQuery = cleanQuery.replace(userMatch[0], "");
            }
            
            cleanQuery = cleanQuery.trim();

            if (tags.length > 0) {
                tags.forEach(tag => {
                    conditions.push(`(FIND_IN_SET(?, q.tags) > 0 OR q.tags LIKE ?)`);
                    params.push(tag);
                    params.push(`%${tag}%`);
                });
            }

            if (userFilter) {
                conditions.push(`(r.user_name LIKE ? OR r.user_name = ?)`);
                params.push(`%${userFilter}%`);
                params.push(userFilter);
            }

            if (cleanQuery) {
                conditions.push(`(q.question_text LIKE ? OR q.question_description LIKE ? OR q.tags LIKE ?)`);
                params.push(`%${cleanQuery}%`);
                params.push(`%${cleanQuery}%`);
                params.push(`%${cleanQuery}%`);
            }
        }

        if (conditions.length > 0) {
            sql += ` WHERE ` + conditions.join(' AND ');
        }

        sql += `
             GROUP BY q.question_id
             ORDER BY q.created_at DESC
        `;

        pool.query(sql, params, (error, results) => {
            if (error) return callBack(error);
            return callBack(null, results);
        });
    },

    getQuestionById: (questionId, callBack) => {
        pool.query(
            `SELECT q.question_id, q.question_text, q.question_description, q.question_code_block,
                    q.tags, q.post_id, q.created_at,
                    r.user_name, r.user_id
             FROM questions q
             LEFT JOIN registration r ON q.user_id = r.user_id
             WHERE q.question_id = ?`,
            [questionId],
            (error, results) => {
                if (error) return callBack(error);
                return callBack(null, results);
            }
        );
    },

    createQuestion: (data, callBack) => {
        pool.query(
            `INSERT INTO questions(question_text, question_description, question_code_block, tags, post_id, user_id)
             VALUES(?, ?, ?, ?, ?, ?)`,
            [
                data.question_text,
                data.question_description,
                data.question_code_block || null,
                data.tags || null,
                data.post_id,
                data.user_id
            ],
            (error, results) => {
                if (error) return callBack(error);
                return callBack(null, results);
            }
        );
    },

    getAnswersForQuestion: (questionId, callBack) => {
        pool.query(
            `SELECT a.answer_id, a.answer, a.answer_code, a.created_at, a.reply_to_id,
                    r.user_name, r.user_id,
                    (SELECT parent.answer FROM answers parent WHERE parent.answer_id = a.reply_to_id) AS parent_answer,
                    (SELECT r_parent.user_name FROM answers parent LEFT JOIN registration r_parent ON parent.user_id = r_parent.user_id WHERE parent.answer_id = a.reply_to_id) AS parent_user_name
             FROM answers a
             LEFT JOIN registration r ON a.user_id = r.user_id
             WHERE a.question_id = ?
             ORDER BY a.created_at ASC`,
            [questionId],
            (error, results) => {
                if (error) return callBack(error);
                return callBack(null, results);
            }
        );
    },

    createAnswer: (data, callBack) => {
        pool.query(
            `INSERT INTO answers(answer, answer_code, user_id, question_id, reply_to_id)
             VALUES(?, ?, ?, ?, ?)`,
            [
                data.answer,
                data.answer_code || null,
                data.user_id,
                data.question_id,
                data.reply_to_id || null
            ],
            (error, results) => {
                if (error) return callBack(error);
                return callBack(null, results);
            }
        );
    },

    getDuplicates: (title, callBack) => {
        if (!title || !title.trim()) {
            return callBack(null, []);
        }

        const stopWords = new Set(["how", "to", "a", "is", "in", "the", "of", "and", "or", "for", "with", "on", "at", "by", "an", "what", "where", "when", "who", "why", "can", "do", "does", "did", "my", "your", "this", "that"]);
        const words = title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w));

        if (words.length === 0) {
            return callBack(null, []);
        }

        let matchSql = [];
        let params = [];
        words.forEach(word => {
            matchSql.push(`(q.question_text LIKE ? OR q.question_description LIKE ? OR q.tags LIKE ?)`);
            params.push(`%${word}%`, `%${word}%`, `%${word}%`);
        });

        const sql = `
            SELECT q.question_id, q.question_text, q.tags, q.created_at,
                   r.user_name,
                   (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS answer_count
            FROM questions q
            LEFT JOIN registration r ON q.user_id = r.user_id
            WHERE (${matchSql.join(' OR ')})
            HAVING answer_count > 0
            ORDER BY answer_count DESC, q.created_at DESC
            LIMIT 5
        `;

        pool.query(sql, params, (error, results) => {
            if (error) return callBack(error);
            return callBack(null, results);
        });
    }
};
