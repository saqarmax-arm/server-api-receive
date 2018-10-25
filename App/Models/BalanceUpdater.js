const mongoose = require('mongoose');


const TYPES = {};
TYPES.BLOCK_UPDATER = 'block_updater';

const balanceUpdaterSchema = new mongoose.Schema({

    type: {
        type: String,
        required: true,
        unique : true,
        index: {unique: true},
        default: TYPES.BLOCK_UPDATER
    },

    last_block_number: {
        type: Number,
        required: true,
        default : 0
    }

}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const BalanceUpdater = mongoose.model('BalanceUpdater', balanceUpdaterSchema);

BalanceUpdater.TYPES = TYPES;

module.exports = BalanceUpdater;