const async = require('async');
const config = require('../../config/main.json');
const BigNumber = require('bignumber.js');
const BalanceUpdaterRepository = require('../Repositories/BalanceUpdaterRepository');
const TransactionRepository = require('../Repositories/TransactionRepository');
const rpcRepositoryInstance = require('../Repositories/RpcRepository');
const BalanceTransferService = require('./BalanceTransferService');


class BalanceReceiveService {

    static updateBlockById(blockId, next) {

        return async.waterfall([(cb) => {

            return rpcRepositoryInstance.getBlockHash(blockId, (err, hash) => {
                if (err || !hash) {
                    return cb('getBlockHash error');
                }

                return cb(null, hash);

            });

        }, (blockHash, cb) => {

            return BalanceReceiveService.checkBlockByHash(blockHash, (err) => {
                return cb(err);
            });

        }, (callback) => {

            return BalanceUpdaterRepository.setLastCheckedBlock(blockId, (err) => {
                return callback(err);
            });

        }], (err) => {
            return next(err);
        });

    }

    static checkTransactionTransferByTxs(txs, next) {

        let addresses = [],
            addressesHash = {};

        txs.forEach((tx) => {

            if (tx.vout && tx.vout.length) {

                tx.vout.forEach((vOut) => {

                    if (vOut && vOut.scriptPubKey && vOut.scriptPubKey.addresses && vOut.scriptPubKey.addresses.length) {

                        vOut.scriptPubKey.addresses.forEach((address) => {

                            if (address && !addressesHash[address]) {

                                addressesHash[address] = true;
                                addresses.push(address);

                            }

                        });

                    }

                });

            }

        });

        if (!addresses || !addresses.length) {
            return next();
        }

        return async.waterfall([(callback) => {
            return TransactionRepository.findTransactionsByAddresses(addresses, (err, transactions) => {
                return callback(err, transactions);
            });
        }, (transactions, callback) => {

            if (!transactions || !transactions.length) {
                return callback();
            }

            return async.eachSeries(transactions, (transaction, cb) => {

                return BalanceReceiveService.checkTransactionTransfer(transaction, (err) => {
                    return cb(err);
                });

            }, (err) => {
                return callback(err);
            });

        }], (err) => {
            return next(err);
        });
    }

    static checkWaitFinishTxs(txs, next) {

        if (!txs || !txs.length) {
            return next();
        }

        let txIds = [],
            txIdsHash = {};

        txs.forEach((tx) => {
            txIds.push(tx.txid);
            txIdsHash[tx.txid] = tx;
        });

        return TransactionRepository.findWaitFinishAndNotFinishedTrxs(txIds, (err, transactions) => {

            if (err || !transactions.length) {
                return next(err);
            }

            return async.each(transactions, (transaction, callback) => {
                return async.waterfall([(callback) => {
                    return TransactionRepository.updateStatusToFinished(transaction._id, txIdsHash[transaction.tx_hash_transfer].time * 1000, (err) => {
                        return callback(err);
                    });
                }], () => {
                    return callback(err);
                });

            }, (err) => {
                return next(err);
            });

        });

    }

    static checkBlockByHash(blockHash, next) {

        return async.waterfall([(callback) => {
            return BalanceReceiveService.getBlockTrxsByBlockHash(blockHash, (err, txs) => {
                return callback(err, txs);
            });
        }, (txs, callback) => {

            return async.parallel([
                (cb) => {
                    return BalanceReceiveService.checkTransactionTransferByTxs(txs, (err) => {
                        return cb(err);
                    });
                },
                (cb) => {
                   return BalanceReceiveService.checkWaitFinishTxs(txs, (err) => {
                       return cb(err);
                   });
                }
            ], (err) => {
                return callback(err);
            });

        }], (err) => {

            if (err) {
                return next(err);
            }

            return next(null);
        });

    }

    static getBlockTrxsByBlockHash(blockHash, next) {

        return async.waterfall([(callback) => {

            return rpcRepositoryInstance.getBlock(blockHash, (err, block) => {

                return callback(err, block);

            });

        }, (block, callback) => {

            let txs = [];

            return async.eachSeries(block.tx, (txHash, cb) => {
                return rpcRepositoryInstance.getRawTransaction(txHash, (err, tx) => {
                    if (err) {
                        return cb(err);
                    }

                    txs.push(tx);

                    return cb(err, tx);
                });
            }, (err) => {
                return callback(err, txs);
            });

        }], (err, txs) => {
            return next(err, txs);
        });
    }

    static checkTransactionTransfer(transaction, next) {

        return rpcRepositoryInstance.getAddressBalance([transaction.address], (err, balanceObject) => {
            if (err) {
                return next(err);
            }

            if (!balanceObject.balance) {
                return next();
            }

            let balanceSatoshi = new BigNumber(balanceObject.balance),
                balance = balanceSatoshi.dividedBy(1e8),
                amount = new BigNumber(transaction.amount);

            if (balance.gt(0) && (amount.isZero() || (amount.gt(0) && balance.gte(amount)))) {

                return async.waterfall([(callback) => {

                    return rpcRepositoryInstance.getAddressUtxos([transaction.address], (err, utxo) => {

                        if (err) {
                            return next(err);
                        }

                        if (!utxo || !utxo.length) {
                            return next();
                        }

                        return callback(null, utxo);


                    })
                }, (utxo, callback) => {

                    let findUtx = utxo.find((utx) => {

                        if (utx.satoshis > 0) {

                            let utxAmountSatoshi = new BigNumber(utx.satoshis),
                                utxAmount = utxAmountSatoshi.dividedBy(1e8);

                            if (!amount.isZero()) {
                                return true;
                            } else if (amount.gt(0) && utxAmount.gte(amount)) {
                                return true;
                            }

                        }

                        return false;

                    });

                    return callback(null, findUtx);

                }], (err, utx) => {

                    if (err || !utx) {
                        return next(err, utx);
                    }

                    return async.waterfall([(callback) => {
                        return rpcRepositoryInstance.getRawTransaction(utx.txid, (err, tx) => {
                            return callback(err, tx);
                        });
                    }, (tx, callback) => {
                        return TransactionRepository.updateStatusToConfirmed(transaction._id, utx.txid, tx.time * 1000, (err) => {
                            return callback(err);
                        });
                    }, (callback) => {
                        return BalanceTransferService.transfer(transaction, (err) => {
                            return callback(err);
                        });
                    }], (err, data) => {
                        return next(err, data);
                    });

                });

            } else {
                return next();
            }

        });

    }

}

module.exports = BalanceReceiveService;