const moment = require('moment');

class DateTimeHelper {

    static isISO8601String(string) {
        return moment(string, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', true).isValid()
    }

    static getDiffFromNow(string, measurement) {

        if (!DateTimeHelper.isISO8601String(string)) {
            throw new Error('Invalid ISO8601 format')
        }

        return moment.utc().diff(moment.utc(string, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', true), measurement);

    }

}

module.exports = DateTimeHelper;