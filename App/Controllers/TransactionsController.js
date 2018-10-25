const async = require('async');
const _ = require('lodash');
const logger = require('log4js').getLogger('${ROOT}/App/Controllers/TransactionsController.js');
const config = require('../../config/main.json');
const ResponseUserErrors = require('../Components/ResponseUserErrors');
const Address = require('../Components/Address');
const UserKey = require('../Models/UserKey');
const Transaction = require('../Models/Transaction');
const CryptoService = require('../Services/CryptoService');
const SignatureService = require('../Services/SignatureService');
const TransactionSignature = require('../Services/TransactionSignature');
const DateTimeHelper = require('../Helpers/DateTimeHelper');
const TransactionRepository = require('../Repositories/TransactionRepository');
const mongoose = require('mongoose');
const Buffer = require('buffer').Buffer;

class TransactionsController {

    constructor(rpcRepository) {
        logger.info('Init');
        this.rpcRepository = rpcRepository;
        this.create = this.create.bind(this);
        this.getTransaction = this.getTransaction.bind(this);
    }

    getTransaction(cb, data) {

        let req = data.req,
            trxId = req.params.trxId;

        if (!mongoose.Types.ObjectId.isValid(trxId)) {
            return cb(ResponseUserErrors.createErrorsFromText('Bad request', '', 400));
        }

        return TransactionRepository.findTransactionById(trxId, (err, data) => {

            if (err || !data) {
                return cb(ResponseUserErrors.createErrorsFromText('Not Found', '', 404));
            }

            return cb(null, data);

        });

    }

    create(cb, data) {

        let req = data.req,
            payload = req.body.payload,
            signature = req.body.header && req.body.header.signature ? req.body.header.signature : null,
            decodedJson;

        if (!payload || !signature) {
            return cb(ResponseUserErrors.createErrorsFromText('Bad Request', '', 400));
        }

        try {
            decodedJson = JSON.parse(Buffer.from(payload, 'base64').toString());
        } catch (e) {
            return cb(ResponseUserErrors.createErrorsFromText('Bad Request', '', 400));
        }

        if (!decodedJson || !decodedJson.public_key || !decodedJson.datetime || _.isUndefined(decodedJson.amount)) {
            return cb(ResponseUserErrors.createErrorsFromText('Bad Request', '', 400));
        }

        let datetime = decodedJson.datetime,
            public_key = decodedJson.public_key,
            finalTransferAddress = decodedJson.final_transfer_address,
            amount = parseFloat(decodedJson.amount);

        if (!DateTimeHelper.isISO8601String(datetime)) {
            return cb(ResponseUserErrors.createErrorsFromText('Invalid datetime', 'datetime', 422));
        } else if (!SignatureService.signatureTimeIsValid(datetime)) {
            return cb(ResponseUserErrors.createErrorsFromText('Invalid signature', 'signature', 422));
        }


        if (finalTransferAddress && !Address.isValid(finalTransferAddress, config.NETWORK)) {
            return cb(ResponseUserErrors.createErrorsFromText('Invalid transfer address', 'final_transfer_address', 422));
        }

        let dataFlow = {};

        return async.waterfall([
            (callback) => {

                return UserKey.findOne({public_key: public_key}, (err, existingUserKey) => {

                    if (err) {
                        return callback(ResponseUserErrors.createErrorsFromText('User Key with that public_key not exists.', 'public_key', 422));
                    }

                    if (!existingUserKey) {
                        return callback(ResponseUserErrors.createErrorsFromText('User Key with that public_key not exists.', 'public_key', 422));
                    }

                    dataFlow.userKey = existingUserKey;

                    return callback();

                });

            },
            (callback) => {

                if (dataFlow.userKey.address || finalTransferAddress) {
                    return callback();
                }

                return callback(ResponseUserErrors.createErrorsFromText('User Key with that public_key don\'t have address.', null, 422));

            },
            (callback) => {

                let isValid = TransactionSignature.verifyTransactionSignature({
                    payload: payload,
                    signature: signature
                });

                if (!isValid) {
                    return callback(ResponseUserErrors.createErrorsFromText('Invalid signature', 'signature', 422));
                }

                return callback(null);

            },
            (callback) => {

                return this.rpcRepository.getNewAddress((err, address) => {

                    if (err || !address || !address.address) {
                        return callback(ResponseUserErrors.createErrorsFromText('Cant get a new address', '', 422))
                    }

                    return callback(null, address.address);

                });

            },
            (address, callback) => {

                return Transaction.create({
                    user_key_id: dataFlow.userKey.id,
                    is_pending: true,
                    address: address,
                    amount: amount,
                    final_transfer_address: (!dataFlow.userKey.address && finalTransferAddress) ? finalTransferAddress : ""
                }, (err, tr) => {

                    if(err) {
                        return callback(ResponseUserErrors.createErrorsFromText('Transaction create error', '', 422));
                    }

                    return callback(null, tr);

                });

            }
        ], (responseErrors, result) => {
            return cb(responseErrors, result);
        });

    }

}

module.exports = TransactionsController;