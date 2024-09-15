const ErrorHandler = require("./../utilities/errorHandler");
const authService = require("../services/authServices");
const { executeQuery } = require('../config/dbConfig')


exports.logIn = async (req, res, next) => {
  try {
    if (!req.body.username || !req.body.password) {
      return next(new ErrorHandler("Please Provide valid input", 500));
    }
    const { username, password } = req.body;
    const query = `SELECT user_id, user_name, user_email, user_password FROM user_credentials WHERE user_name = ?`
    const [user] = await executeQuery(query, [username])
    
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (user?.user_password != password) {
      return next(new ErrorHandler("Wrong email or Password", 401));
    }

    const token = authService.createToken({ user_id: user?.user_id });

    res.json({
      success: true,
      data: user,
      token: token,
    });
  } catch (error) {
    return next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    if (req.user) {
      res.json({
        success: true,
        data: req.user,
      });
    } else {
      return next(new ErrorHandler("Unauthorized", 401));
    }
  } catch (error) {
    return next(error);
  }
};
