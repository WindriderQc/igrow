require('dotenv').config()

const mqtt = require('mqtt'),
 assert = require('assert'),
 //fetch = require('node-fetch'),
 esp32 = require('./esp32'),
 mqttServerIp = process.env.DATA_API_IP,
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


function initMqtt() 
{
    if (mqtt_) {   console.warn("Already initialized and Trying to init MQTT again!");   return mqtt_    }

    console.log('Attempting MQTT connection...')

    let mqttclient = mqtt.connect("mqtt://" + mqttServerIp, mqttOptions)


   
    mqttclient.on('error', (err) => {  console.log(err)  })

    mqttclient.on('connect', () => {  
        console.log('MQTT connected\n')
        mqttclient.subscribe('esp32')
        mqttclient.subscribe('esp32/#') //  listening to all esp32 post
    })
    
    mqttclient.on('message', async (topic, message) => {


       // consoleMsg(topic, message)


        if (topic == 'esp32/boot') //  message is an arrayBuffer and contains ESP_ID
        {
            const espID = message.toString()
            console.log("Topic: ", topic, "  msg: ", espID )
            
            await esp32.register(espID)

            esp32.setConfig(espID, mqttclient)
            await esp32.setAlarms(message, mqttclient)   //  TODO:  valider pkoi ca marche ici direct avec le buffer sans conversion string
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


    esp32.setConnectedValidation(mqttclient, 1000) //  check every 1s if devices are still connected

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


function getMqttClient() {  assert.ok(mqtt_, "Mqtt has not been initialized. Please called init first.");  return mqtt_  }


module.exports = {
  getMqttClient,
  initMqtt
};

