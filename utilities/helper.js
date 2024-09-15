const moment = require('moment');
const momentTimezone = require('moment-timezone');



exports.currentDate=()=>{
    const now = moment().format('YYYY-MM-DD');
     return now;
}

exports.currentTime=()=>{
    const currentTime = momentTimezone().tz('Asia/Kolkata').format('HH:mm:ss');
    return currentTime;
}

exports.currentDateTime=()=>{
    const currentTime = momentTimezone().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    return currentTime;
}
