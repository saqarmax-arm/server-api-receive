const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: {unique: true}
    },
    password: {
        type: String,
        required: true
    },
    lastLoginDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});


/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {

    const user = this;

    if (!user.isModified('password')) { return next(); }

    bcrypt.genSalt(10, (err, salt) => {

        if (err) { return next(err); }

        bcrypt.hash(user.password, salt, (err, hash) => {

            if (err) { return next(err); }

            user.password = hash;

            return next();

        });

    });
});


/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {

    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        cb(err, isMatch);
    });

};

userSchema.set('toJSON', {
    transform: (doc, ret) => {
        return {
            _id: ret._id,
            email: ret.email
        };
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;