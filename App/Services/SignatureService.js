const config = require('../../config/main.json');
const DateTimeHelper = require('../Helpers/DateTimeHelper');

class SignatureService {

    static signatureTimeIsValid(datetime) {

        if (!datetime || !DateTimeHelper.isISO8601String(datetime)) {
            throw new Error('Invalid ISO8601 format');
        }

        let diffFromNow = DateTimeHelper.getDiffFromNow(datetime, 'seconds');

        if (diffFromNow > config.SIGNATURE_LIFETIME_SEC  || diffFromNow < 0) {
            return false;
        }

        return true;
    }

}

module.exports = SignatureService;