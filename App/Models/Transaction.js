const mongoose = require('mongoose');
const TransactionStatus = require('../Components/TransactionStatus');

const transactionSchema = new mongoose.Schema({
    user_key_id: {
        type: String,
        required: true
    },
    final_transfer_address: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default : 0
    },
    is_pending: {
        type: Boolean,
        required: true,
        default : false
    },
    is_wait_confirm: {
        type: Boolean,
        required: true,
        default : false
    },
    is_confirmed: {
        type: Boolean,
        required: true,
        default : false
    },
    is_wait_finish: {
        type: Boolean,
        required: true,
        default : false
    },
    is_finished: {
        type: Boolean,
        required: true,
        default : false
    },
    tx_hash_receive: {
        type: String,
        required: false,
        default: null
    },
    tx_receive_created_at: {
        type: Date,
        required: false,
        default: null
    },
    tx_hash_transfer: {
        type: String,
        required: false,
        default: null
    },
    tx_transfer_created_at: {
        type: Date,
        required: false,
        default: null
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

transactionSchema.set('toJSON', {
    transform: (doc, ret) => {
        return {
            _id: ret._id,
            address: ret.address,
            final_transfer_address: ret.final_transfer_address,
            status: TransactionStatus.getAliasByTrx(ret),
            amount: ret.amount,
            tx_hash_receive: ret.tx_hash_receive,
            tx_receive_created_at: ret.tx_receive_created_at,
            tx_hash_transfer: ret.tx_hash_transfer,
            tx_transfer_created_at: ret.tx_transfer_created_at,
            created_at: ret.created_at
        };
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;