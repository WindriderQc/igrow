require('dotenv').config()

const mqtt = require('mqtt'),
 assert = require('assert'),
 //fetch = require('node-fetch'),
 {esp32} = require('./esp32'),
 mqttServerIp = process.env.MQTT_SERVER_IP,
 mqttUser = process.env.MQTT_USER,
 mqttPass = process.env.MQTT_PASS


let mqtt_

const mqttOptions = {
    port: 1883,
    rejectUnauthorized: false,
    username: mqttUser,
    password: mqttPass
  }


function initMqtt() 
{
    if (mqtt_) {   console.warn("Already initialized and Trying to init MQTT again!");   return mqtt_    }

    console.log('Attempting connection...')

    let mqttclient = mqtt.connect("mqtt://" + mqttServerIp, mqttOptions)
   
    mqttclient.on('error', (err) => {  console.log(err)  })

    mqttclient.on('connect', () => {  
        console.log('mqtt connected')
        mqttclient.subscribe('esp32')
        mqttclient.subscribe('esp32/#') //  listening to all esp32 posts
    })
    
    mqttclient.on('message', async (topic, message) => {
        if (topic == 'esp32/boot') //  message is an arrayBuffer and contains ESP_ID
        {
            const espID = message.toString()
            console.log("Topic: ", topic, "  msg: ", espID )
            
            esp32.register({ type: 'esp32', id: espID, configName:"default", lastBoot: Date.now(), connected: true })
            esp32.setConfig(espID, mqttclient)
            esp32.setAlarms(message, mqttclient)   //  TODO:  valider pkoi ca marche ici direct avec le buffer sans conversion string
        }
        else if (topic == 'esp32/sensors') 
        {
            let msg = message.toString()
            let data = JSON.parse(msg)
            console.log(data)
            if(data.action_type == 'btnBlue'  && data.value == '1') {   //  {"device":"ESP_15605", "io":"BLUE", "action_type":"btnBlue", "value": "1"}
            // waterburst();  //  TODO :    a rendre solide...   architecture de merde...
            }
        }
        else if (topic.indexOf('esp32/alive/') >= 0) 
        { 
            let heartbeat = JSON.parse(message)//  console.log("Message: ", heartbeat)
            //esp32.saveEspPost(heartbeat)
            esp32.receiveMessage(heartbeat)
        }
        else { consoleMsg(topic, message) }  // prints all other messages to console   
    })


    setInterval(esp32.validConnected, 1000)

    mqtt_ = mqttclient
    return mqtt_
}



function consoleMsg(topic, message) 
{
    try {  
        let msg
        msg = JSON.parse(message)
        console.log('Topic: ', topic, '  msg: ', msg)
    }                                                                                            //  if not a json....   
    catch (e) {  console.log('Topic: ', topic, '  Msg is not a JSON-ConvertingToString: ' + message.toString())  }   //  then convert buffer to string       
}


function getMqttClient() {  assert.ok(mqtt_, "Mqtt has not been initialized. Please called init first.");  return mqtt_  }


module.exports = {
  getMqttClient,
  initMqtt
};

