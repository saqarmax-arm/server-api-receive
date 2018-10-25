const mongoose = require('mongoose');
const CryptoService = require('../Services/CryptoService');

const userKeySchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    public_key: {
        type: String,
        required: true,
        unique : true
    },
    private_key: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: false,
        unique : false,
        index: {unique: true}
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

/**
 * encrypt private key.
 */
userKeySchema.pre('save', function save(next) {

    const userKey = this;

    if (!userKey.isModified('private_key')) { return next(); }

    userKey.private_key = CryptoService.encryptPrivateKey(userKey.private_key);

    return next();

});
userKeySchema.set('toJSON', {
    transform: (doc, ret) => {
        return {
            _id: ret._id,
            user_id: ret.user_id,
            address: ret.address,
            public_key: ret.public_key,
            private_key: CryptoService.decryptPrivateKey(ret.private_key),
            created_at: ret.created_at,
        };
    }
});

const UserKey = mongoose.model('UserKey', userKeySchema);

module.exports = UserKey;