const config = require('../../config/main.json');
const DateTimeHelper = require('../Helpers/DateTimeHelper');
const RangeHelper = require('../Helpers/RangeHelper');
const Transaction = require('../Models/Transaction');
const TransactionRepository = require('../Repositories/TransactionRepository');
const UserKeyRepository = require('../Repositories/UserKeyRepository');
const rpcRepositoryInstance = require('../Repositories/RpcRepository');
const async = require('async');
const BigNumber = require('bignumber.js');

class BalanceTransferService {

    static transfer(transaction, next) {

        let dataFlow = {
            utx: null,
            userKey: null
        };

        return async.waterfall([(callback) => {

            return rpcRepositoryInstance.getAddressUtxos([transaction.address], (err, utxo) => {

                if (err) {
                    return callback(err);
                }

                dataFlow.utx =  utxo.find((utx) => {

                    if (transaction.amount) {
                        let num = new BigNumber(utx.satoshis),
                            amount = num.dividedBy(1e8);

                        return amount.gte(transaction.amount);
                    }

                    return utx.satoshis > 0;
                });

                return callback(err);

            });

        }, (cb) => {

            return UserKeyRepository.getUserKeyById(transaction.user_key_id, (err, userKey) => {

                if (err) {
                    return cb(err);
                }

                dataFlow.userKey = userKey;

                return cb();
            });

        }, (cb) => {

            let utx = dataFlow.utx,
                userKey = dataFlow.userKey;

            if (!utx) {
                return cb();
            }

            let num = new BigNumber(utx.satoshis),
                amount = num.dividedBy(1e8).minus(0.001).toString(10),
                addrObj = {};

            if (transaction.final_transfer_address) {
                addrObj[transaction.final_transfer_address] = amount;
            } else {
                addrObj[userKey.address] = amount;
            }

            return async.waterfall([(callback) => {
                return rpcRepositoryInstance.createRawTransaction(JSON.stringify([{txid: utx.txid, vout: utx.outputIndex}]), addrObj, (err, data) => {
                    return callback(err, data);
                });
            }, (hex, callback) => {

                return rpcRepositoryInstance.signRawTransaction(hex, (err, signTrx) => {
                    return callback(err, signTrx);
                });

            }, (signTrx, callback) => {

                if (!signTrx.complete) {
                    return callback('Not complete sign');
                }

                return rpcRepositoryInstance.sendRawTransaction(signTrx.hex, (err, response) => {
                    return callback(err, response);
                });

            }], (err, data) => {
                return cb(err, data);
            });

        }], (err, txHashTransfer) => {

            if (err || !txHashTransfer) {
                return next(err, txHashTransfer);
            }

            return TransactionRepository.updateTrxToWaitFinish(transaction._id, txHashTransfer, (err) => {
                return next(err);
            });

        });

    }

}

module.exports = BalanceTransferService;