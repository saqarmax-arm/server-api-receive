const logger = require('log4js').getLogger('${ROOT}/App/Controllers/UsersController.js');
const User = require('../Models/User');
const passport = require('passport');
const moment = require('moment');
const async = require('async');
const ResponseUserErrors = require('../Components/ResponseUserErrors');

class UsersController {

    constructor() {
        logger.info('Init');
    }

    create(next, data) {

        let req = data.req;

        req.sanitize('email').trim();
        req.sanitize('email').normalizeEmail({ remove_dots: false });
        req.checkBody('email', 'Invalid email').isEmail();
        req.checkBody('password', 'Password cannot be blank').notEmpty();
        req.checkBody('password', 'Password must be at least %1 characters long').len(6);

        let email = req.body.email ? req.body.email.toLowerCase() : '',
            password = req.body.password;

        async.waterfall([
            (callback) => {

                req.getValidationResult().then((result) => {

                    if (!result.isEmpty()) {
                        return callback(ResponseUserErrors.createFromValidationErrorResult(result));
                    }

                    return callback();

                });

            },
            (callback) => {

                User.findOne({email: email}, (err, existingUser) => {

                    if (err) {
                        return callback(err);
                    }

                    if (existingUser) {
                        return callback(ResponseUserErrors.createErrorsFromText('Account with that email address already exists.', 'email'));
                    }


                    return callback();

                });
            },
            (callback) => {

                User.create({
                    email: email,
                    password: password
                }, (err, user) => {

                    if (err) {
                        return callback(err);
                    }

                    return callback(null, user);

                });
            },
            (user, callback) => {

                req.logIn(user, (err) => {

                    if (err) {
                        return callback(err);
                    }

                    return callback(null, user);
                });

            }
        ], (err, result) => {
            return next(err, result);
        });

    }

    login(next, data) {

        let req = data.req,
            res = data.res;

        req.sanitize('email').trim();
        req.sanitize('email').normalizeEmail({ remove_dots: false });
        req.checkBody('email', 'Email is not valid').isEmail();
        req.checkBody('password', 'Password cannot be blank').notEmpty();

        async.waterfall([
            (callback) => {

                req.getValidationResult().then((result) => {

                    if (!result.isEmpty()) {
                        return callback(ResponseUserErrors.createFromValidationErrorResult(result));
                    }

                    return callback();
                });

            },
            (callback) => {

                passport.authenticate('local', (err, user, info) => {

                    if (err) {
                        return callback(ResponseUserErrors.createErrorsFromText('Authenticate error', ''));
                    }

                    if (!user) {
                        return callback(ResponseUserErrors.createErrorsFromText('Invalid username or password', ''));
                    }

                    return callback(null, user);

                })(req, res, next);

            },
            (user, callback) => {

                user.lastLoginDate = moment().format();

                user.save((err) => {

                    if (err) {
                        return callback(ResponseUserErrors.createErrorsFromText('Login error', ''));
                    }

                    return callback(null, user);

                });

            },
            (user, callback) => {

                req.logIn(user, (err) => {

                    if (err) {
                        return callback(ResponseUserErrors.createErrorsFromText('Login error', ''));
                    }

                    return callback(null, user);
                });

            }
        ], (err, user) => {
            return next(err, user);
        });
    }

    logout(cb, data) {

        data.req.logout();
        cb();

    }

}

module.exports = UsersController;