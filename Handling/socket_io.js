  var clients = {};
  var dbSql = require('../Database/node2db.js');

  var TAG = 'socket_io.js';
  
  var commands = {
      dbProvinceList: 'dbProvinceList',
      dbDistrictInfor: 'dbDistrictInfor',
  };

  function Provlst_DB(io, data) {
      
    var sql = dbSql.sqlLstProvince;

      dbSql.sqlConnection(sql, function(err, rows) {
          if (err) {
              io.sockets.connected[clients[data.username].socket].emit("message", {resCommand : data.command, resData: err.message});
          } else {
              var province = new Map();

              // province.set('name', 'kevin');
              // province.set('age', '24');
              // console.log(province);
            // console.log(rows.provinceName);
              // IE8이상의 익스플로러는 아래의 for of 구문 지양
              for (let row of rows) {
                  if (province.has(row.provinceName)) {
                      var tmpArr = province.get(row.provinceName);
                      
                      tmpArr.push(row.districtName);
                      province.set(row.provinceName, tmpArr);
                  } else {
                      var arrDst = [];
                      arrDst.push(row.districtName);
                      
                      province.set(row.provinceName, arrDst);
                  }
              }

              var resData = JSON.stringify([...province]);
              io.sockets.connected[clients[data.username].socket].emit("message", {
                  resCommand: data.command,
                  resData
              });
          }
      });
    }

  function Dist_Info(io, data) {

      var sql = dbSql.sqlDistrictInfor(data);

      dbSql.sqlConnection(sql, function(err, rows) {
          if (err) {
              io.sockets.connected[clients[data.username].socket].emit("message", {resCommand : data.command, resData: err.message});
          } else {
              var resData;
              for (let row of rows) {
                  resData = {
                      locationDst: row.locationDst,
                      humidity: row.humidity,
                      temp: row.temp,
                      windDirect: row.windDirect,
                      windVelocity: row.windVelocity,
                      weather: row.weather,
                      water: row.water
                  }
              }
              // console.log(resData);
              io.sockets.connected[clients[data.username].socket].emit("message", {resCommand : data.command, resData});
          }
      });
  }

  function processCommand(io, data) {
      switch (data.command) {
          case commands.dbProvinceList:
              Provlst_DB(io, data);
              console.log(data);
              break;
          case commands.dbDistrictInfor:
              Dist_Info(io, data);
              break;
          default:
              break;
      }
  }

  function init(socketio) {
      socketio.sockets.on('connection', function(socket) {

          socket.on('add-user', function(data) {
              clients[data] = {
                  "socket": socket.id
              };
              console.log(TAG, 'add-user: ' + data);
          });
          socket.on('message', function(data) {
              if (clients[data.username]) {
                  processCommand(socketio, data);
              } else {
                  console.log(TAG, "User does not exist: " + data.username);
              }
          });

          socket.on('disconnect', function() {
              for (var name in clients) {
                  if (clients[name].socket === socket.id) {
                      delete clients[name];
                      break;
                  }
              }
          });
      });
  }

  module.exports.init = init;
  module.exports.clients = clients;