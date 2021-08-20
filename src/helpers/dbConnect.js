const mongoose = require('mongoose');
require('dotenv').config();


const connect = () => {
    const atlasClient = {
        password: process.env.DB_PASSWORD,
        db: process.env.DB_NAME
    };

    const uri = `mongodb+srv://root:${atlasClient.password}@cluster0.5ivtj.mongodb.net/${atlasClient.db}?retryWrites=true&w=majority`;

    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 1000 })
        .then(() => console.log("Connected to MDB Atlas successfully!"))
        .catch(err => {
            console.log("MDB Atlas could not connect :>>");
            if (process.env.NODE_ENV == 'development') console.log(err);
            connect();
        });
};

module.exports = {
    connect
};