"use strict";
const express = require('express');
const async = require('async');
const logger = require('log4js').getLogger('${ROOT}/App/Controllers/ApiController.js');
const moment = require('moment');
const mongoose = require('mongoose');
const extend = require('extend');
const passport = require('passport');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const MongoStore = require('connect-mongo')(session);
const cors = require('cors');
const _ = require('lodash');
const fs = require('fs');
const expressValidator = require('express-validator');
const passportConfig = require('./../Config/passport'); //Init passport config

const ResponseUserErrors = require('../Components/ResponseUserErrors');
const UsersController = require('./UsersController');
const KeysController = require('./KeysController');
const TransactionsController = require('./TransactionsController');
const path = require('path');

class ApiController {

    constructor(rpcRepositoryInstance) {
        logger.info('Init');
        this.app = null;
        this.sessionStore = null;
        this.rpcRepository = rpcRepositoryInstance;
    }

    initRoutes() {

        let usersController = new UsersController();

        this.addHandler('post', '/api/v1/users', usersController.create, true);
        this.addHandler('post', '/api/v1/login', usersController.login, true);
        this.addHandler('post', '/api/v1/logout', usersController.logout, false);

        let keysController = new KeysController();

        this.addHandler('post', '/api/v1/keys', keysController.create, false);
        this.addHandler('get', '/api/v1/keys', keysController.getUserKeys, false);

        let transactionsController = new TransactionsController(this.rpcRepository);

        this.addHandler('get', '/api/v1/transactions/:trxId', transactionsController.getTransaction, true);
        this.addHandler('post', '/api/v1/transactions', transactionsController.create, true);

    }

    init(port) {

        this.sessionStore = new MongoStore({mongooseConnection: mongoose.connection});
    	this.runServer(port);

		let corsOptions = {
			origin: (origin, callback) => {
				callback(null, true);
			},
			credentials: true,
			methods: ['GET', 'PUT', 'POST', 'OPTIONS', 'DELETE', 'PATCH'],
			headers: ['x-user', 'X-Signature', 'accept', 'content-type']
		};

		this.app.use(cors(corsOptions));
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use(expressValidator());
        this.app.use(bodyParser.json());
        this.app.options('*', cors());
        this.app.use(session({
			resave: true,
			saveUninitialized: true,
			secret: '459ao8kslfg40eef3898aloemxdf32b31a6',
			store: this.sessionStore
		}));

        this.app.use(passport['initialize']());
        this.app.use(passport['session']());

        this.initRoutes();
	}

    runServer(port) {
        this.app = express();
        this.app.use(express.static(path.resolve('public')));
        this.server = require('http').Server(this.app);
        this.server.listen(port, '0.0.0.0');

        logger.info('API APP REST listen ' + port + ' Port');

	}

    /**
     * Register new route.
     */
    addHandler(type, route, action, isPublic) {

        if(typeof action != 'function') {
            logger.warn(`Action for route ${type}:${route} is not function`);
        }

        this.app[type](route, (req, res) => {

            async.waterfall([
                cb => {

                    if(isPublic) return cb();

                    if(!req.isAuthenticated()) return cb(ResponseUserErrors.createErrorsFromText('User not logged', '', 403));

                    return cb();
                },
                // run method
                cb => {
                    action(cb, {
                        _post: req.body,
                        _get: extend({}, req.query, req.params),
                        req: req,
                        res: res,
                        user: req.user
                    });
                }
            ], (err, result) => {

                res.header('Content-Type', 'text/json');

                if(err) {

                    if(typeof err == 'string') {
                        err = {
                            message: err
                        };
                    }

                    if (err instanceof ResponseUserErrors) {
                        return res.status(err.getCode()).end(JSON.stringify(err.getResponseErrors()));
                    }

                    if (_.isArray(err)) {
                        return res.status(422).end(JSON.stringify(err));
                    }

                    return res.status((result && !isNaN(parseInt(result))) ? result : 400).end(JSON.stringify(err));
                }

                if(typeof result != 'object') {
                    result = {
                        result: result
                    };
                }

                return res.send(result);
            });
            this.logRouter(type, route);
        });

    }

    logRouter(type, route) {
        return logger.info(`[REQUEST] ${type.toUpperCase()}: '${route}'`);
    }

}

module.exports = ApiController;