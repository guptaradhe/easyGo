const jwt = require('jsonwebtoken');
const mysecret = 'myultrasecretcode'


const createToken = (payload)=>{
    return jwt.sign(payload, mysecret);
}

module.exports = {
    createToken
}