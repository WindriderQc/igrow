require('dotenv').config()
const mqtt = require('mqtt')
//const fs = require('fs')
const assert = require('assert')
const fetch = require("node-fetch")
const moment = require('moment')
const esp32 = require('./esp32')

const apiUrl = process.env.API_URL


let mqtt_

const mqttOptions = {
    port: 1883,
    rejectUnauthorized: false,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS
  }


function initMqtt() 
{
    if (mqtt_) {   console.warn("Already initialized and Trying to init MQTT again!")
      return mqtt_
    }

    console.log('Attempting connection...')

    let mqttclient = mqtt.connect("mqtt://" + process.env.MQTT_SERVER_IP, mqttOptions)
   
    mqttclient.on('error', (err) => {  console.log(err)  })

    mqttclient.on('connect', () => {  
        console.log('mqtt connected')
        mqttclient.subscribe('esp32')
        mqttclient.subscribe('esp32/#') //  listening to all esp32 posts
    })
    
    mqttclient.on('message', async (topic, message) => {
      
      if (topic == 'esp32/boot') 
      {
        printmsg(topic, message) //  message is an arrayBuffer and contains ESP_ID
        esp32.setESPConfig(message, mqttclient)

        const rawResponse = await fetch(apiUrl + '/api/alarms/' + message); 
        const alarms = await rawResponse.json()
        for( als of alarms) {
          mqttclient.publish('esp32/' + message + '/io/sunrise', "" + als.io + ":" + moment(als.tStart).format('HH:mm:ss'))
          mqttclient.publish('esp32/' + message + '/io/nightfall',"" + als.io + ":" + moment(als.tStop).format('HH:mm:ss'))
        }
      }
      else if (topic.indexOf('esp32/alive/') >= 0) 
      { 
          let msg = JSON.parse(message)
          esp32.saveEspPost(msg, apiUrl + '/heartbeats')
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
      else { printmsg(topic, message) }  // prints all other messages to console   
    })


    mqtt_ = mqttclient
    return mqtt_
}


function printmsg(topic, message) 
{
    let msg
    try {
      msg = JSON.parse(message)

    }
    catch (err) {
      msg = message.toString()
    }
    console.log(topic)
    console.log(msg)
}


function getMqttClient() {
  assert.ok(mqtt_, "Mqtt has not been initialized. Please called init first.")
  return mqtt_
}




module.exports = {
  getMqttClient,
  initMqtt
};

