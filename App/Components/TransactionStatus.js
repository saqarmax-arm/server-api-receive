const _ = require('lodash');

class TransactionStatus {

    static getAliasByTrx(trx) {

        let orderFields = ['is_finished', 'is_confirmed', 'is_wait_confirm', 'is_pending'],
            mapOrderFields = ['finished', 'confirmed', 'wait_confirm', 'pending'],
            mapIdx;

        orderFields.find((field, idx) => {

            if (trx[field]) {

                mapIdx = idx;

                return true;

            }

            return false;

        });

        if (_.isUndefined(mapIdx)) {
            throw new Error('Idx error');
        }

        return mapOrderFields[mapIdx];

    }
}

module.exports = TransactionStatus;