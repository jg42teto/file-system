const mysql = require('mysql2')
const config = require('#root/config/mysql.config')

const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    connectTimeout: config.connectTimeout,
});

function query(q, params) {
    return new Promise((resolve, reject) => {
        pool.query(q, params, function (error, results, fields) {
            if (error) {
                console.error('error connecting: ' + error.stack);
                reject(error);
            }
            resolve(results, fields);
        });
    })
}

module.exports = {
    query
}