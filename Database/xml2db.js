var fs = require('fs');
var http = require('http');
var parser = require('xml2json-light');     // module of being possible to convert xml to json
var dbSql = require('./node2db.js');

var TAG = "xml2db.js";

function perform() {

    dbSql.createDatabase();    

    fs.readFile('Database/weather.xml', 'utf8', function(err, data) {
        if (err) {
            console.log(TAG, err);
        } else {
            Xml2Data(data);
            
        }
    });

    // setInterval: reececute every 3 hours
    setInterval(function() {
        // read the file, 'weather.xml'         
        fs.readFile('weather.xml', 'utf8', function(err, data) {
            if (err) {
                console.log(TAG, err);
            } else {
                Xml2Data(data);
                
            }
        });
    }, 10800000);       // every 3 hours
}

function Xml2Data(xmlString) {
    var readXML = parser.xml2json(xmlString);
    var sqlConn = dbSql.sqlOpenConn();

    var provincelst = readXML.Weather.MainArea;
    for (var i = 0; i < provincelst.length; i++) {
        var districtLst = provincelst[i].SubArea;
        var provinceName = provincelst[i].Name.replace(">","");

        //insert data to database
        for (var j = 0; j < districtLst.length; j++) {

            var districtName = districtLst[j].Name;
            var districLoc = districtLst[j].Location;
            var provinceName = provincelst[i].Name.replace(">","");
            var bindData = {
                provinceName,
                districtName,
                districLoc
            };
            
            Data_url(districtLst[j].WeatherAdd, function(dstWeather) {
                var dataDst = {
                    provinceName: this.data.provinceName,
                    districtName: this.data.districtName,
                    locationDst: this.data.districLoc,
                    humidity: dstWeather.humidity,
                    temp: dstWeather.temp,
                    windDirect: dstWeather.windDirect,
                    windVelocity: dstWeather.windVelocity,
                    weather: dstWeather.weather,
                    water: dstWeather.water
                };
                var insertDst = dbSql.sqlInsertDistrict(dataDst);
                dbSql.sqlQuery(sqlConn, insertDst, function(err, rows) {
                    if (err) {
                        console.log(TAG, err);
                    }
                });
            }.bind({
                data: bindData
            }));
        }
    }
}

function Data_url(url, callback) {
    http.get(url, (resp) => {
        let data = '';
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            var readXML = parser.xml2json(data);
            var dataForecast = readXML.rss.channel.item.description.body.data;
            var weath = dataForecast[0]; // first three hour weather forecast
            var dataDst = {
                humidity: weath.reh,
                temp: weath.temp,
                windDirect: weath.wd,
                windVelocity: weath.ws,
                weather: weath.wfKor,
                water: weath.pop
            };
            callback(dataDst);
        });
    }).on("error", (err) => {
        console.log(TAG, "Error: " + err.message);
    });
}

module.exports.perform = perform;