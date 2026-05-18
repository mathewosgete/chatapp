const {
    getAllQuestions,
    getQuestionById,
    createQuestion,
    getAnswersForQuestion,
    createAnswer,
    getDuplicates
} = require('./question.service');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    getQuestions: (req, res) => {
        const searchQuery = req.query.q || null;
        getAllQuestions(searchQuery, (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err.message });
            return res.status(200).json({ data: results });
        });
    },

    getQuestion: (req, res) => {
        const { questionId } = req.params;
        getQuestionById(questionId, (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err.message });
            if (!results || results.length === 0)
                return res.status(404).json({ message: 'Question not found' });

            const question = results[0];
            getAnswersForQuestion(questionId, (err2, answers) => {
                if (err2) return res.status(500).json({ message: 'Database error', error: err2.message });
                return res.status(200).json({ data: { ...question, answers: answers || [] } });
            });
        });
    },

    getDuplicates: (req, res) => {
        const { title } = req.query;
        getDuplicates(title, (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err.message });
            return res.status(200).json({ data: results });
        });
    },

    postQuestion: (req, res) => {
        const { title, description, codeBlock, tags } = req.body;
        const userId = req.id; // from auth middleware

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        const data = {
            question_text: title.trim(),
            question_description: description.trim(),
            question_code_block: codeBlock ? codeBlock.trim() : null,
            tags: tags ? tags.trim() : null,
            post_id: uuidv4(),
            user_id: userId
        };

        createQuestion(data, (err, result) => {
            if (err) {
                console.error("DB Error creating question:", err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }
            return res.status(201).json({ message: 'Question created', questionId: result.insertId, post_id: data.post_id });
        });
    },

    postAnswer: (req, res) => {
        const { questionId } = req.params;
        const { answer, answerCode, replyToId } = req.body;
        const userId = req.id; // from auth middleware

        if (!answer || !answer.trim()) {
            return res.status(400).json({ message: 'Answer text is required' });
        }

        const data = {
            answer: answer.trim(),
            answer_code: answerCode ? answerCode.trim() : null,
            user_id: userId,
            question_id: questionId,
            reply_to_id: replyToId ? parseInt(replyToId) : null
        };

        createAnswer(data, (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err.message });
            return res.status(201).json({ message: 'Answer posted', answerId: result.insertId });
        });
    }
};
