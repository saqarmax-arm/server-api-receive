const UserKey = require('../Models/UserKey');

class UserKeyRepository {

    static getUserKeyById(id, next) {
        return UserKey.findOne({
            _id: id
        }, (err, userKey) => {
            return next(err, userKey);
        });
    }

}

module.exports = UserKeyRepository;