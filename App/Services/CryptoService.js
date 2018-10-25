const crypto = require('crypto');
const bs58 = require('bs58');
const CryptoKey = require('../Components/CryptoKey');
const config = require('../../config/main.json');
const jsrsasign = require('jsrsasign');
const KEYUTIL = jsrsasign.KEYUTIL;
const DateTimeHelper = require('../Helpers/DateTimeHelper');

const ALGORITHM = 'aes-256-ctr';

class CryptoService {

    static generateEncodeCryptoKey() {

        let RSAKeypair = KEYUTIL.generateKeypair("RSA", 512),
            privatePEM = KEYUTIL.getPEM(RSAKeypair.prvKeyObj, "PKCS8PRV"),
            publicPEM = KEYUTIL.getPEM(RSAKeypair.pubKeyObj),
            hexFromPemPrv = KEYUTIL.getHexFromPEM(privatePEM),
            hexFromPemPub = KEYUTIL.getHexFromPEM(publicPEM);

        return new CryptoKey(hexFromPemPub, hexFromPemPrv);

    }

    static encryptPrivateKey(privateKey) {

        let cipher = crypto.createCipher(ALGORITHM, config.ENCRYPT_PRIVATE_KEY_SALT),
            crypted = cipher.update(privateKey, 'utf8', 'hex');

        crypted += cipher.final('hex');

        return crypted;

    }

    static decryptPrivateKey(encryptedPrivateKey) {

        let decipher = crypto.createDecipher(ALGORITHM, config.ENCRYPT_PRIVATE_KEY_SALT),
            dec = decipher.update(encryptedPrivateKey, 'hex', 'utf8');

        dec += decipher.final('utf8');

        return dec;

    }

}

module.exports = CryptoService;