require('dotenv').config()

const mqtt = require('mqtt'),
 assert = require('assert'),
 //fetch = require('node-fetch'),
 esp32 = require('./esp32'),
 apiUrl = process.env.API_URL


let mqtt_

const mqttOptions = {
    port: 1883,
    rejectUnauthorized: false,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS
  }


function initMqtt() 
{
    if (mqtt_) {   console.warn("Already initialized and Trying to init MQTT again!");   return mqtt_    }

    console.log('Attempting connection...')

    let mqttclient = mqtt.connect("mqtt://" + process.env.MQTT_SERVER_IP, mqttOptions)
   
    mqttclient.on('error', (err) => {  console.log(err)  })

    mqttclient.on('connect', () => {  
        console.log('mqtt connected')
        mqttclient.subscribe('esp32')
        mqttclient.subscribe('esp32/#') //  listening to all esp32 posts
    })
    
    mqttclient.on('message', async (topic, message) => {
        if (topic == 'esp32/boot') //  message is an arrayBuffer and contains ESP_ID
        {
            printmsg(topic, message) 
            esp32.setConfig(message.toString(), mqttclient)
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
            esp32.saveEspPost(heartbeat, apiUrl + '/api/heartbeats')
        }
        else { printmsg(topic, message) }  // prints all other messages to console   
    })


    mqtt_ = mqttclient
    return mqtt_
}



function printmsg(topic, message) 
{
    console.log(topic)

    let msg
    try {  msg = JSON.parse(message)  }    //  if not a json....   
    catch (e) {                            //  then convert buffer to string
        msg = message.toString()          
        console.log('Msg is not a JSON. toString: ' + msg)                  
    }  
}


function getMqttClient() {  assert.ok(mqtt_, "Mqtt has not been initialized. Please called init first.");  return mqtt_  }


module.exports = {
  getMqttClient,
  initMqtt
};

