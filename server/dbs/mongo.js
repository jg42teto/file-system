const { MongoClient } = require('mongodb');
const config = require('#root/config/mongo.config')

const url = `mongodb://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?maxPoolSize=${config.maxPoolSize}&connectTimeoutMS=${config.connectTimeoutMS}`;

var client;
var db;
MongoClient.connect(url, {}, function (error, _client) {
    if (error) throw error;
    client = _client;
    db = client.db('dfdb')
});

async function query() {
    while (!client) {
        await new Promise(r => setTimeout(r, 200));
    }
    return db;
}

module.exports = {
    query
};