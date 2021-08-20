const bcrypt = require('bcrypt');


class Crypt {
    async hash(plainText, rounds) {
        return await bcrypt.hash(plainText, rounds || 10)
            .then(value => value)
            .catch(err => {
                console.log("Error hashing text! :>>", err);
                return null;
            });
    };

    async compare(plainText, hash) {
        return await bcrypt.compare(plainText, hash)
            .then(value => value)
            .catch(err => {
                console.log("Error comparing hash! :>>", err);
                return null;
            });
    };
};

module.exports = new Crypt();