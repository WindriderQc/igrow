require('dotenv').config()

const mqtt = require('mqtt'),
 assert = require('assert'),
 //fetch = require('node-fetch'),
 mqttServerUrl = process.env.MQTT_SERVER_URL,
 mqttUser = process.env.USER,
 mqttPass = process.env.PASS


let mqtt_

const mqttOptions = {
    clientId: "mServer" + Math.random().toString(16),
    port: 1883,
    rejectUnauthorized: false,
    username: mqttUser,
    password: mqttPass, 
    clean_session: true   //  this option insure message are not stored and resend between devices deconnection
  }


function initMqtt(msgHandler) 
{
    if (mqtt_) {   console.warn("Already initialized and Trying to init MQTT again!");   return mqtt_    }

    console.log('Attempting MQTT connection...')

    let mqttclient = mqtt.connect( mqttServerUrl, mqttOptions)


   
    mqttclient.on('error', (err) => {  console.log(err)  })

    mqttclient.on('connect', () => {  
        console.log('MQTT connected\n')
        mqttclient.subscribe('esp32')
        mqttclient.subscribe('esp32/#') //  listening to all esp32 post
    })
    
    mqttclient.on('message', async (topic, message) => {

        if(!msgHandler(topic, message, mqttclient))  consoleMsg(topic, message)      // prints all other messages to console
    })

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
    catch (e) {  console.log('Topic: ', topic, 'msg', message.toString(), '  --Msg is not a JSON-ConvertedToString')  }   //  then convert buffer to string       
}


function getClient() {  assert.ok(mqtt_, "Mqtt has not been initialized. Please called init first.");  return mqtt_  }


module.exports = {
    getClient,
    initMqtt, 
    consoleMsg
};

