const ResponseUserError = require('./ResponseUserError');

class ResponseUserErrors {

    constructor(errors, code) {
        this.errors = errors;
        this.code = code;

        if (!this.code) {
            this.code = 422;
        }
    }

    getResponseErrors() {
        return {
            code: this.getCode(),
            errors: this.getErrors()
        }
    }

    getErrors() {
        return this.errors;
    }

    getCode() {
        return this.code
    }

    /**
     *
     * @param result Object
     * @returns {ResponseUserErrors}
     */
    static createFromValidationErrorResult(result) {

        let generatedErrors = [],
            errors = result.array();

        errors.forEach((err) => {
            generatedErrors.push(new ResponseUserError(err.msg, err.param))
        });

        return new ResponseUserErrors(generatedErrors, 422);
    }

    /**
     *
     * @param msg String
     * @param param String
     * @param code Integer
     * @returns {ResponseUserErrors}
     */
    static createErrorsFromText(msg, param, code) {
        return new ResponseUserErrors([new ResponseUserError(msg, param)], code);
    }

}

module.exports = ResponseUserErrors;