const logger = require('log4js').getLogger('${ROOT}/App/Controllers/KeysController.js');
const UserKey = require('../Models/UserKey');
const CryptoService = require('../Services/CryptoService');
const async = require('async');
const config = require('../../config/main.json');
const ResponseUserErrors = require('../Components/ResponseUserErrors');
const Address = require('../Components/Address');

class KeysController {

    constructor() {
        logger.info('Init');
    }

    create(cb, data) {

        let req = data.req;

        req.sanitize('address').trim();

        let address = req.body.address,
            userId = req.user.id;

        return async.waterfall([
            (callback) => {

                req.getValidationResult().then((result) => {

                    if (!result.isEmpty()) {
                        return callback(ResponseUserErrors.createFromValidationErrorResult(result));
                    }

                    return callback();
                });

            },
            (callback) => {

                if (address && !Address.isValid(address, config.NETWORK)) {
                    return callback(ResponseUserErrors.createErrorsFromText(`Invalid address for ${config.NETWORK}.`, 'address'));
                }

                return callback();

            },
            (callback) => {

                if (!address) {
                   return callback();
                }

                return UserKey.findOne({address: address}, (err, existingUserKey) => {

                    if (err) {
                        return callback(ResponseUserErrors.createErrorsFromText('Cant fetch a UserKey', 'address'));
                    }

                    if (existingUserKey) {
                        return callback(ResponseUserErrors.createErrorsFromText('Key with that address already exists.', 'address'));
                    }

                    return callback();
                });

            },
            (callback) => {

                let cryptoKey = CryptoService.generateEncodeCryptoKey();

                UserKey.create({
                    public_key: cryptoKey.publicKey,
                    private_key: cryptoKey.privateKey,
                    user_id: userId,
                    address: address
                }, (err, key) => {

                    if(err) {
                        logger.error(err);
                        return callback(ResponseUserErrors.createErrorsFromText('User Key create error', ''));
                    }

                    return callback(null, key);

                });

            }
        ], (err, key) => {
            return cb(err, key);
        });

    }

    getUserKeys(cb, data) {

        let userId = data.req.user.id;

        UserKey.find({user_id: userId}, (err, keys) => {

            if (err) {
                return cb(ResponseUserErrors.createErrorsFromText('Get User Keys error', ''));
            }

            return cb(null, keys);

        });

    }

}

module.exports = KeysController;