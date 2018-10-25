const BalanceUpdater = require('../Models/BalanceUpdater');
const async = require('async');
const config = require('../../config/main.json');

class BalanceUpdaterRepository {

    static getLastCheckedBlock(cb) {

        return BalanceUpdater.findOne({type: BalanceUpdater.TYPES.BLOCK_UPDATER}, (err, existingType) => {

            if (err) {
                return cb(err);
            }

            return cb(null, existingType.last_block_number);

        });

    }

    static setLastCheckedBlock(height, next) {
        return BalanceUpdater.update({type: BalanceUpdater.TYPES.BLOCK_UPDATER}, { $set: { last_block_number: height  }}, (err, data) => {
            return next(err, data);
        });
    }

    static setBalanceUpdaterType(next) {

        return async.waterfall([(callback) => {

            return BalanceUpdater.findOne({type: BalanceUpdater.TYPES.BLOCK_UPDATER}, (err, existingType) => {
                return callback(err, existingType);
            });

        }, (existingType, callback) => {

            if (!existingType) {

                return BalanceUpdater.create({
                    type: BalanceUpdater.TYPES.BLOCK_UPDATER,
                    last_block_number: 0
                }, (err, row) => {
                    return callback(err, row);
                });

            } else {
                return callback(null, existingType);
            }
        }, (existingType, callback) => {

            if (config.UPDATE_FROM_BLOCK_HEIGHT > existingType.last_block_number) {

                return BalanceUpdaterRepository.setLastCheckedBlock(config.UPDATE_FROM_BLOCK_HEIGHT, (err) => {
                    return callback(err);
                });

            } else {
                return callback();
            }

        }], (err) => {
            return next(err);
        });

    }


}

module.exports = BalanceUpdaterRepository;