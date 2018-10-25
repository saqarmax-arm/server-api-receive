const logger = require('log4js').getLogger('${ROOT}/App/Components/Socket/ZmqEvents.js');
const async = require('async');
const TransactionTransformService = require('../../Services/TransactionTransformService');
const TransactionRepository = require('../../Repositories/TransactionRepository');
const balancesUpdaterInstance = require('../BalancesUpdater');

class ZmqEvents {

    constructor(zmqSubSocket) {

        logger.info('Init');
        this.zmqSubSocket = zmqSubSocket;
        this._subscribeZmqEvents();

    }

    _subscribeZmqEvents() {

        this.zmqSubSocket.subscribe('hashblock');
        this.zmqSubSocket.subscribe('rawtx');

        this.zmqSubSocket.on('message', (topic, message) => {

            let topicString = topic.toString('utf8');

            switch (topicString) {
                case 'rawtx':
                    this._zmqTransactionHandler(message);
                    break;
                case 'hashblock':
                    this._zmqBlockHandler(message);
                    break;
            }

        });
    }

    _zmqBlockHandler() {
        balancesUpdaterInstance.checkBalances((err) => {});
    }

    _zmqTransactionHandler(message) {

        let transformTx = TransactionTransformService.transformFromMessage(message);
        this.updateTrx(transformTx);

    }

    updateTrx(data) {

        if (data && data.vout && data.vout.length) {

            let addresses = [];

            data.vout.forEach((vOut) => {

                let voutAddresses = Object.keys(vOut);

                voutAddresses.forEach((addr) => {
                    addresses.push(addr)
                });

            });

            if (addresses && addresses.length) {

                return TransactionRepository.findTransactionsByAddresses(addresses, (err, transactions) => {

                    if (!transactions || !transactions.length) {
                        return null;
                    }

                    return async.each(transactions, (transaction, callback) => {

                        return TransactionRepository.updateStatusToWaitConfirm(transaction._id, (err, d) => {
                            return callback(err, d);
                        });

                    }, (err) => {
                        if (err) {
                            logger.error('updateStatusToWaitConfirm ERROR')
                        }
                    });

                });

            }

        }
    }

}

module.exports = ZmqEvents;