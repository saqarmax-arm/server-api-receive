const crypto = require('crypto');
const SignatureService = require('../Services/SignatureService');
const config = require('../../config/main.json');
const jsrsasign = require('jsrsasign');
const KJUR = jsrsasign.KJUR;
const Buffer = require('buffer').Buffer;

class TransactionSignature {

    static verifyTransactionSignature(data) {

        let payload = data.payload,
            decodedPayload,
            decodedJson;

        try {
            decodedPayload = Buffer.from(payload, 'base64').toString();
            decodedJson = JSON.parse(decodedPayload);
        } catch (e) {
            return false;
        }

        if (!SignatureService.signatureTimeIsValid(decodedJson.datetime)) {
            return false;
        }

        try {

            let publicPEM = KJUR.asn1.ASN1Util.getPEMStringFromHex(decodedJson.public_key, 'PUBLIC KEY'),
                verify = crypto.createVerify('RSA-SHA256');

            verify.update(payload);

            return verify.verify(publicPEM, data.signature, 'hex');

        } catch (e) {
            return false;
        }

    }

}

module.exports = TransactionSignature;