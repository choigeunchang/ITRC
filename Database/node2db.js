var mysql = require('mysql');
var TAG = 'node2db.js';
  
// Create database(mydb) and tables (weatherTable, disasterTable)
function createDatabase() {
// connect the Mysql
var con = mysql.createConnection({
    host: "localhost",
    user: "ving",
    password: "1111"
});
con.connect(function(err) {
    if (err !== null) {
        console.log(TAG, "[MYSQL] Error connecting to mysql:" + err + '\n');
    }
});
var sql = 'CREATE DATABASE IF NOT EXISTS monitoring';

con.query(sql, function(err) {
    con.end();
    if (err) {
        console.log(TAG, "[MYSQL] Error executing the query:" + err + '\n');
    }
    console.log(TAG, 'monitoring has been created');
    var sql = 'CREATE TABLE IF NOT EXISTS weatherTable (provinceName VARCHAR(255) NOT NULL, districtName VARCHAR(255) NOT NULL, locationDst VARCHAR(255) NOT NULL, humidity INTEGER(3) NOT NULL, temp FLOAT(4) NOT NULL, windDirect VARCHAR(255) NOT NULL, windVelocity FLOAT(3) NOT NULL, weather VARCHAR(255) NOT NULL, water INTEGER(3) NOT NULL, PRIMARY KEY (provinceName, districtName));';
    sqlConnection(sql, function() {
        console.log(TAG, 'weatherTable has been created');
    });
    
    var sql = 'CREATE TABLE IF NOT EXISTS disasterTable (id int NOT NULL AUTO_INCREMENT PRIMARY KEY, disasterType VARCHAR(255) NOT NULL, location VARCHAR(255) NOT NULL, level VARCHAR(255) NOT NULL, time VARCHAR(255) NOT NULL, user VARCHAR(255) NOT NULL);';
    sqlConnection(sql, function() {
        console.log(TAG, 'disasterTable has been created');
    });
});
}

var sqlConnection = function (sql, next) {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'ving',
        password: '1111',
        database: 'monitoring'
    }); 
    connection.connect(function(err) {
        if (err !== null) {
            console.log(TAG, "[MYSQL] Failed the connecting in MySQL:" + err + '\n');
        }
    });
    connection.query(sql, function(err) {
        connection.end();
        if (err) {
            console.log(TAG, "[MYSQL] Failed the executing query:" + err + '\n');
        }
        // Callback 함수 실행
        next.apply(this, arguments);
    });
}

var sqlOpenConn = function () {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'ving',
        password: '1111',
        database: 'monitoring'
    }); 
    connection.connect(function(err) {
        if (err !== null) {
            console.log(TAG, "[MYSQL] Error about connecting the MySQL:" + err + '\n');
        }
    });
    return connection;
}
var sqlCloseConn = function(conn) {
    conn.end(function(err) {
        if (err) {
            console.log(TAG, err.message);
        }
    });
}
var sqlQuery = function (connection, sql, next) {
    connection.query(sql, function(err) {
        if (err) {
            console.log(TAG, "[MYSQL] Error about executing the query:" + err + '\n');
        }
        // Execute the callback
        next.apply(this, arguments);
    });
}

var sqlLstProvince = "SELECT provinceName, districtName FROM weatherTable;";

var sqlDistrictInfor = function(data) {
    var sql = "SELECT locationDst, humidity, temp, windDirect, windVelocity, weather, water FROM weatherTable WHERE provinceName = '" + data.provinceName +"' AND districtName = '" +data.districtName + "';";
    return sql;
}
var sqlInsertDistrict = function(data) {
    var sql = "REPLACE INTO weatherTable (provinceName, districtName, locationDst, humidity, temp, windDirect, windVelocity, weather, water) VALUES ('" + data.provinceName + "', '" + data.districtName + "', '" + data.locationDst + "', " + data.humidity + ", " + data.temp + ", '" + data.windDirect + "', " + data.windVelocity + ", '" + data.weather + "', " + data.water +")";
    return sql;
}
var sqlUpdateDistrict = function(data) {
    var sql = "UPDATE weatherTable SET provinceName = '" + data.provinceName + "', districtName = '" + data.districtName + "', locationDst = '" + data.locationDst +  "', humidity = '" + data.humidity +  "', temp = '" + data.temp +  "', windDirect = '" + data.windDirect +  "', windVelocity = '" + data.windVelocity +  "', weather = '" + data.weather + "' WHERE provinceName = '" + data.provinceName + "' AND districtName = '" + data.districtName + "';";
    return sql;
}
var sqlDelDst = function(data) {
    var sql = "DELETE FROM weatherTable WHERE districtName = '" + data + "';";
    return sql;
}
var sqlInsertDisasterInfor = function(data) {
    var sql = "INSERT INTO disasterTable (disasterType, location, level, time, user) VALUES ('" + data.command + "', '" + data.location + "', '" + data.level + "', '" + data.time + "', '" + data.username + "')";
    return sql;
}
var sqlLstDisasterInfor = "SELECT * FROM disasterTable;";

module.exports.sqlConnection = sqlConnection
module.exports.sqlLstProvince = sqlLstProvince;
module.exports.sqlDistrictInfor = sqlDistrictInfor;

module.exports.sqlInsertDistrict = sqlInsertDistrict;
module.exports.sqlUpdateDistrict = sqlUpdateDistrict;
module.exports.sqlDelDst = sqlDelDst;

module.exports.sqlOpenConn = sqlOpenConn;
module.exports.sqlCloseConn = sqlCloseConn;
module.exports.sqlQuery = sqlQuery;

module.exports.sqlLstDisasterInfor = sqlLstDisasterInfor
module.exports.sqlInsertDisasterInfor = sqlInsertDisasterInfor;

module.exports.createDatabase = createDatabase;