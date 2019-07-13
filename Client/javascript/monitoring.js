var map;
var markers = [], circles = [], bubble = [];
var socket = io.connect("https://0.0.0.0:8080");
var userID = "c"ving

var res_temp, res_humi, res_windv, res_weather, res_water;

var commands = {
    dbProvinceList: 'dbProvinceList',
    dbDistrictInfor: 'dbDistrictInfor',
};

socket.on('connect', function(data) {
    console.log(userID, 'Connect to socket server');
    socket.emit('add-user', userID);
    ResCommand();
});

function ResCommand() {
    socket.on("message", function(data) {
        switch (data.resCommand) {
            case commands.dbProvinceList:
                var arr = JSON.parse(data.resData);
                Add_Prov_Info(arr);
                break;
            case commands.dbDistrictInfor:
                Marker_Dist_Info(data.resData);
                ProgressBar();
                break;
            default:
                break;
        }
    })
};

function sendCommand(opts, json) {
    if (!socket.connected) {
        setTimeout(function() {
            sendCommand(opts, json);
        }, 1000);
        return;
    }
    var paras;
    switch (opts) {
        case commands.dbProvinceList:
            paras = {
                username: userID,
                command: commands.dbProvinceList
            };
            break;
        case commands.dbDistrictInfor:
            json['username'] = userID;
            json['command'] = commands.dbDistrictInfor
            paras = json;
            break;
        default:
            break;
    }
    socket.emit('message', paras);
    console.log(paras);
}

// For using this navigator function, we have to have a CA in ssh.
function Current_Loc(strDisplay, callback) {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);

            Marker_Clear();
            var marker = new google.maps.Marker({
                position: pos,
                map: map
            });
            markers.push(marker);
            var infowindow = new google.maps.InfoWindow({
                content: strDisplay,
                maxWidth: 80
            });
            infowindow.open(map, marker);
            map.addListener('click', function() {
                infowindow.open(map, marker);
            });
            bubble.push(infowindow);

            callback(pos);
        });
    }
}

// When Loading the map firstly
function initMap() {

    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        zoom: 14,
    };
    map = new google.maps.Map(mapCanvas, mapOptions);

    Current_Loc("You are here", function() {});
}

function Connect_btn() {
    // Declare the value that element id="ip" in HTML
    var message = $('#ip').val();

    if(message == "0.0.0.0") {
        sendCommand(commands.dbProvinceList, {
            command: commands.dbProvinceList,
            data: ''
        });
    }
    else {
        alert("Ip가 올바르지 않습니다.");
    }
}

function Add_Prov_Info(provinceLst) {
    // document: HTML, getElementById("t"): get a element that id="t"
    var province = document.getElementById("province");
    province.innerHTML = "";        // change the element content to " " (= init)
    for (var i = 0; i < provinceLst.length; i++) {
        var x = provinceLst[i];
        var atag = document.createElement("a");     // Add the element 'a' in HTML
        // Declare the variable 'temp' adding the 'hexDecode(x[0])' in selected element
        var temp = document.createTextNode(x[0]);
        // console.log(temp);
        atag.appendChild(temp);     // Add the child element in selected element
        atag.classList.add('list-group-item');
        province.appendChild(atag);
    }
    
    // Event of selecting the Province list element
    $('#province .list-group-item').on('click', function() {
        // Activate the Province List
        var $this = $(this);
        $('#province .active').removeClass('active');
        $this.toggleClass('active')
        var provinceTxt = $this.text();
        var provinceIdx;

        for (provinceIdx=0; provinceIdx<provinceLst.length; provinceIdx++) {
            if (provinceLst[provinceIdx][0] == provinceTxt) {
                break;
            }
        }
            
        // the same as above
        var district = document.getElementById("district");
        var districtLst = provinceLst[provinceIdx][1];

        district.innerHTML = "";
        for (var i=0; i<districtLst.length; i++) {
            var atag = document.createElement("a");
            var temp2 = document.createTextNode(districtLst[i]);
            // console.log(temp2);
            atag.appendChild(temp2);
            atag.classList.add('list-group-item');
            district.appendChild(atag);
        }

        $('#district .list-group-item').on('click', function() {
            var $this = $(this);
            $('#district .active').removeClass('active');
            $this.toggleClass('active')
            var districtTxt = $this.text();

            sendCommand(commands.dbDistrictInfor, {
                command: commands.dbDistrictInfor,
                provinceName: provinceTxt,
                districtName: districtTxt
            });
        });
    });
}

// Display the weather information in Google Map using parsing data.
function Marker_Dist_Info(json) {
    
    var arrSplit = json.locationDst.split(',');
    var location = {
        lat: parseFloat(arrSplit[0]),
        lng: parseFloat(arrSplit[1])
    };
    
    // Information about rss data
    var string = '<b>온도</b>: ' + json.temp + '℃ 　<b>습도</b>: ' + json.humidity + '%<br>';
    string += '<b>풍속</b>: ' + parseFloat(json.windVelocity).toFixed(1) + 'm/s　<b>풍향</b>: ' + WindDirSymbol(parseInt(json.windDirect)) + '<br>';
    string += '<b>날씨</b>: ' + json.weather + '<br>';
    string += '<b>강수확률</b>: ' + json.water + '%<br>';

    var center = new google.maps.LatLng(parseFloat(arrSplit[0]), parseFloat(arrSplit[1]));
    map.panTo(center);

    var marker = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        position: location,
        map: map
    });
    
    var infowindow = new google.maps.InfoWindow({
        content: string,
        maxWidth: 220,
        zoom: 9
    });

    res_temp = json.temp;
    res_humi = json.humidity;
    res_windv = json.windVelocity;
    res_weather = json.weather;
    res_water = json.water;

    // Display the different types of Circle depending on the temperature condition.
    var circle = Draw_Circle(location, res_humi);
    
    Marker_Clear();
    // Add values in every object literal using push()
    markers.push(marker);
    bubble.push(infowindow);
    circles.push(circle);

    infowindow.open(map, marker);
}

// Draw a different types of Circle
function Draw_Circle(loc, humi) {

    // console.log(parseInt(humi));
    if(parseInt(humi)>=45) {
        // console.log("red");
        var circle = new google.maps.Circle({    
            strokeColor: '#62ef70',
            strokeOpacity: 0.8,    
            strokeWeight: 2,
            fillColor: '#62ef70',    
            fillOpacity: 0.35,    
            map: map,    
            center: loc,    
            radius: 1000,        //  unit: meter (m)
            draggable:false
        });
    }
    else if(parseInt(humi)>=30) {
        // console.log("yellow");
        var circle = new google.maps.Circle({    
            strokeColor: '#fff600',
        strokeOpacity: 0.8,    
        strokeWeight: 2,
        fillColor: '#fff600',    
        fillOpacity: 0.35,    
        map: map,    
        center: loc,    
        radius: 1000,
        draggable:false
        });
    }
    else {
        // console.log("green");
        var circle = new google.maps.Circle({    
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,    
            strokeWeight: 2,
            fillColor: '#FF0000',    
            fillOpacity: 0.35,    
            map: map,    
            center: loc,    
            radius: 1000,
            draggable:false
        });
    }

    return circle;
}

// Market infomation initalization
function Marker_Clear() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    for (var i = 0; i < bubble.length; i++) {
        bubble[i].close();
    }
    bubble = [];
    for (var i = 0; i < circles.length; i++) {
        circles[i].setMap(null);
    }
    circles = [];
}

// Convert numbers to direction arrows for wind direction in rss data.
function WindDirSymbol(num) {
    var symbol = '';
    switch (num) {
        case 0:
            symbol = "↑";
            break;
        case 1:
            symbol = "↗";
            break;
        case 2:
            symbol = "→";
            break;
        case 3:
            symbol = "↘";
            break;
        case 4:
            symbol = "↓";
            break;
        case 5:
            symbol = "↙";
            break;
        case 6:
            symbol = "←";
            break;
        case 7:
            symbol = "↖";
            break;
        default:
            break;
    }
    return symbol;
}

// Progress Bar related by weather infomation using crawling
function ProgressBar() {

    var fire = document.getElementById("firebar");
    var earth = document.getElementById("floodbar");
    var typhoon = document.getElementById("typhoonbar");
    var sink = document.getElementById("sinkbar");

    fire.style.width = ((res_temp / 40 * 100) + (res_windv / 17 * 100)) / 4 + '%';
    earth.style.width = ((res_water + (res_humi/2)) / 2) + '%';
    typhoon.style.width = (res_windv / 17 * 100) + '%';
    sink.style.width = (res_water / 2) + '%';

    $("#firebar").text((((res_temp / 40 * 100) + (res_windv / 17 * 100)) / 4).toFixed(2) + '%');
    $("#floodbar").text(((res_water + (res_humi/2)) / 2).toFixed(2) + '%');
    $("#typhoonbar").text((res_windv / 17 * 100).toFixed(2) + '%');
    $("#sinkbar").text((res_water / 2).toFixed(2) + '%');

    $("#firebar").attr("class", "progress-bar bg-success");
    $("#floodbar").attr("class", "progress-bar bg-warning");
    $("#typhoonbar").attr("class", "progress-bar bg-danger");
    $("#sinkbar").attr("class", "progress-bar");
}
