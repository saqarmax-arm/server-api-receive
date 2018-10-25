const fs = require('fs');
const logger = require('log4js').getLogger("${ROOT}/server.js");
const async = require('async');
const configPath = __dirname + '/config/main.json';
const DB = require('./App/Components/DB');
const Socket = require('./App/Components/Socket/Socket');
const balancesUpdaterInstance = require('./App/Components/BalancesUpdater');
const dir = require('node-dir');

if(!fs.existsSync(configPath)) {
    logger.error("Config file not found. Please create main.json file in config folder");
    process.exit(1);
}

const config = require(configPath);
const ApiController = require('./App/Controllers/ApiController');
const rpcRepositoryInstance = require('./App/Repositories/RpcRepository');

class Server {

    constructor() {
        logger.info('Init');
        this.init();
    }

    init() {
        async.waterfall([
            this.connectToDB,
            this.runSocket,
            this.startBalanceUpdater,
            this.run
        ], () => {
            logger.info('Server running');
        });
    }

    connectToDB(cb) {

        let configDB = config.db,
            userUrl = (configDB['user']) ? (configDB['user'] + ':' + configDB['password'] + '@') : '',
            url = 'mongodb://' + userUrl + configDB['host'] + ':' + configDB['port'] + '/' + configDB['database'],
            db = new DB(url);

        db.connect((err) => {

            if (err) {
                return cb(err);
            }

            return cb();

        });

    }

    runSocket(cb) {

        new Socket(config.ZMQ_URL);

        return cb();
    }

    startBalanceUpdater(cb) {

        balancesUpdaterInstance.start(() => {
            logger.info('Balance updater started!');
            return cb();
        });

    }

    run() {

        let apiController = new ApiController(rpcRepositoryInstance);
        apiController.init(config.PORT || 5555);

    }

}

new Server();