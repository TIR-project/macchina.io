var net = require('net');
function getSensorsReads(){
    // Search for sensors in the Service Registry
    var temperatureRefs = serviceRegistry.find('io.macchina.physicalQuantity == "temperature"');
    var humidityRefs = serviceRegistry.find('io.macchina.physicalQuantity == "humidity"');
    if (temperatureRefs.length > 0 && humidityRefs.length > 0){

	    var temperatureSensor = temperatureRefs[0].instance();
	    var humiditySensor = humidityRefs[0].instance();

	    var temperature = temperatureSensor.value();
	    var humidity = humiditySensor.value();
	    return [temperature, humidity];
    }
    else{
        logger.error('No sensor found.');
    }
}
function sendsensorValueToThingspeak(){
        let x = getSensorsReads();
        let temperature = x[0];
        let humidity = x[1];
        logger.notice(temperature);
        logger.notice(humidity);
	    var thingspeakRequest = new net.HTTPRequest('POST', 'http://api.thingspeak.com/update.json?api_key=Q1WI0O5S1ZFOA88W&field1=' + temperature + '&field2=' + humidity);
        var result;
        thingspeakRequest.send(result);

}
setInterval(sendsensorValueToThingspeak, 1000);


///database part
var data = require('data');

var path = bundle.persistentDirectory + 'sensorlog.sqlite';
var session = new data.Session('SQLite', path);


session.execute('PRAGMA journal_mode=WAL');
session.execute('CREATE TABLE IF NOT EXISTS sensorlog ( \
	timestamp LONG, \
	sensor VARCHAR, \
	value FLOAT \
	)');

setInterval(
	function(){
		var ts = Math.floor(DateTime().timestamp/1000);
		let x = getSensorsReads();
        let temperature = x[0];
        let humidity = x[1];
		session.execute('INSERT INTO sensorlog VALUES (?, ?, ?)', ts, 0, temperature);
		session.execute('INSERT INTO sensorlog VALUES (?, ?, ?)', ts, 1, humidity);
	},
	1000);
setInterval(
	function(){
		var recordSet = session.execute('SELECT timestamp, value FROM sensorlog ORDER BY timestamp DESC');
		var logs = JSON.parse(recordSet.toJSON());
		logger.notice(logs[0].value);
	},
	2000);