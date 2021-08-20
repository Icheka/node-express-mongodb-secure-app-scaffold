class _Error {
    guard() {
        return process.on("unhandledRejection", (err, promise) => {
            console.log("An unhandled exception occurred! :>>", err);
        });
    };

};


module.exports = new _Error();