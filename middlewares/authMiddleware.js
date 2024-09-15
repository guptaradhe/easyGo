const jwt = require('jsonwebtoken');
const ErrorHandler = require('./../utilities/errorHandler')
const { executeQuery }  = require('../config/dbConfig')
const mysecret = 'myultrasecretcode'



const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return next(new ErrorHandler('Please provide a token', 401));
        }

        const tokenData = jwt.verify(token, mysecret);
        const query = 'SELECT user_id,admin_id, bussiness_no, user_name, user_email, user_password, user_type FROM user_credentials WHERE user_id = ?'
        const [user] = await executeQuery(query, [tokenData?.user_id])

        delete user.user_password
        if (user) {
            req.user = user
            return next();
        } else {
            console.log("User Unauthorized.");
            return next(new ErrorHandler('Unauthorized', 401));
        }
        
    } catch (error) {
        return next(error);
    }
};

module.exports = authMiddleware;