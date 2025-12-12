var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'tokenpass.ccfy4fmoic7l.ap-northeast-2.rds.amazonaws.com',
    port: 3306,
    user: 'api',
    password: 'Api20220804',
    database: 'api'
});

module.exports = connection;
