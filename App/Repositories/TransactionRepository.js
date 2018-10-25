const Transaction = require('../Models/Transaction');

class TransactionRepository {

    static findTransactionById(id, next) {
        return Transaction.findOne({
            _id: id
        }, (err, transaction) => {
            return next(err, transaction);
        });
    }

    static findTransactionsByAddresses(addresses, next) {
        return Transaction.find({
            address: {$in: addresses}
        }).exec((err, transactions) => {
            return next(err, transactions);
        });
    }

    static findWaitFinishAndNotFinishedTrxs(trxs, next) {
        return Transaction.find({
            tx_hash_transfer: {$in: trxs},
            is_wait_finish: true,
            is_finished: false
        }).exec((err, transactions) => {
            return next(err, transactions);
        });
    }

    static updateStatusToConfirmed(id, txHash, time, next) {
        return Transaction.update({ _id: id }, { $set: { is_confirmed: true , tx_hash_receive: txHash, tx_receive_created_at: time}}, (err, data) => {
            return next(err, data);
        });
    }

    static updateStatusToWaitConfirm(id, next) {
        return Transaction.update({ _id: id }, { $set: { is_wait_confirm: true }}, (err, data) => {
            return next(err, data);
        });
    }

    static updateStatusToFinished(id, time, next) {
        return Transaction.update({ _id: id }, { $set: { is_finished: true, tx_transfer_created_at: time }}, (err, data) => {
            return next(err, data);
        });
    }

    static updateTrxToWaitFinish(id, txHashTransfer, next) {
        return Transaction.update({ _id: id }, { $set: { is_wait_finish: true , tx_hash_transfer: txHashTransfer}}, (err, data) => {
            return next(err, data);
        });
    }


}

module.exports = TransactionRepository;