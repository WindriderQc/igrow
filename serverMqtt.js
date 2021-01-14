const mqtt = require('mqtt')
const fs = require('fs')
const assert = require('assert');
const fetch = require("node-fetch");
const moment = require('moment')

const apiUrl = process.env.API_URL


let mqtt_;



function initMqtt() 
{
    if (mqtt_) {   console.warn("Already initialized and Trying to init MQTT again!")
      return mqtt_
    }


    const options = {
      port: 1883,
      rejectUnauthorized: false,
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASS
    }
    console.log('Attempting connection...')
    let mqttclient = mqtt.connect("mqtt://"+process.env.MQTT_SERVER_IP, options)
 

    mqttclient.on('error', (err) => {  console.log(err)  })


    mqttclient.on('connect', () => {  console.log('mqtt connected')

        mqttclient.subscribe('esp32')
        mqttclient.subscribe('esp32/#') //  listening to all esp32 posts
    })


    mqttclient.on('message', async (topic, message) => {

      if (topic == 'esp32/boot') 
      {
        printmsg(topic, message) //  message is an arrayBuffer

        const als = await getAlarms()   //[{"_id":"5e6a9b80f263a8371216b9d4","espID":"ESP_35030","io":13,"tStart":"2020-03-01T04:30:30.000Z","tStop":"2020-03-01T04:15:15.000Z","__v":0}]

        for ( item of als) 
        {
          const rawResponse = await fetch(apiUrl + '/api/alarms/getLast/' + item)
          const data = await rawResponse.json()
          console.log(data)

          mqttclient.publish('esp32/' + message + '/io/' + data[0].io + '/sunrise', moment(data[0].tStart).format('HH:mm:ss'))
          mqttclient.publish('esp32/' + message + '/io/' + data[0].io + '/nightfall', moment(data[0].tStop).format('HH:mm:ss'))
        }

      }
      else if (topic == 'esp32/command/getAlarms') 
      {
        printmsg(topic, message)

        const als = await getAlarms()   
        
        let list = []
        for ( item of als) 
        {
          const rawResponse = await fetch(apiUrl + '/api/alarms/getLast/' + item)
          const data = await rawResponse.json()
          list.push(data[0])
        }
        mqttclient.publish('esp32/alarmList', JSON.stringify(list))
      }
      else if (topic.indexOf('esp32/alive/') >= 0) 
      { 
          let msg = JSON.parse(message)

          saveEspPost(msg, apiUrl + '/heartbeats')
      }
      else if (topic == 'esp32/sensors') 
      {
        let msg = message.toString()
        let data = JSON.parse(msg)
        console.log(data)
        if(data.action_type == 'btnBlue') {
          waterburst();  //  TODO :    a rendre solide...   architecture de merde...
        }
      }
      else if (topic.indexOf('esp32/ios/') >= 0) {
       

      }
      else {    printmsg(topic, message)    }  // prints all other messages to console
       
     
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



async function saveEspPost(data, pathDB) {

  const option = {
    method: 'POST',
    headers: {      "Content-type": "application/json"    },
    body: JSON.stringify(data)
  }

  try {
    const rawResponse = await fetch(pathDB, option);
    const r = await rawResponse.text()

    if (r === 'Access Denied') { console.log(r) }
    else {
      const result = JSON.parse(r)
      if (result.sender) {       /* console.log('Success: ' + result.sender)  */        }
      else {        console.log('Error: ' + result)      }
    }

  }
  catch (err) { console.log(err) }

}



async function getAlarms() {


  try {
    const rawResponse = await fetch(apiUrl + '/api/alarms/distinct');
    const ioArray = await rawResponse.json()
    //console.log(ioArray)
   


    /*ioArray.then(function(result) {
      console.log(result) // "Some User token"
   })
   */
   /* for(item of ioArray)
    {
      console.log( item)
    }
    */
    return(ioArray)
  }
  catch (err) { console.log(err) }

}


function getMqttClient() {
  assert.ok(mqtt_, "Mqtt has not been initialized. Please called init first.")
  return mqtt_
}


module.exports = {
  getMqttClient,
  initMqtt
};

