require('dotenv').config();
const mqtt = require('mqtt')
const fs = require('fs')
const assert = require('assert');
const fetch = require("node-fetch");
const moment = require('moment');


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
        printmsg(topic, message) //  message is an arrayBuffer and contains ESP_ID

        let config = await getESPConfig(message)
       // let data = await JSON.parse(config)
       
         // console.log(config)
       
         let t = 'esp32/' + message + '/config'
        //console.log(t)
        let conf = await JSON.stringify(config)
        mqttclient.publish(t, conf )


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
        if(data.action_type == 'btnBlue'  && data.value == '1') {   //  {"device":"ESP_15605", "io":"BLUE", "action_type":"btnBlue", "value": "1"}
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



async function getESPConfig(espID) 
{
 
  let config = []

  if(espID.indexOf("ESP_38990") >= 0) {
    config = [ { io: 2,  mode: "IN", lbl: "A0",  isA: 0, pre: "none" } 
              ,{ io: 4,  mode: "IN", lbl: "A1",  isA: 0, pre: "none" }
              ,{ io: 35, mode: "INPULL", lbl: "A2",  isA: 1,  pre: "none" }
              ,{ io: 34, mode: "INPULL", lbl: "A3",  isA: 1,  pre: "none" }
              ,{ io: 36, mode: "INPULL", lbl: "A4",  isA: 1,  pre: "none" }
              ,{ io: 39, mode: "INPULL", lbl: "A5",  isA: 1,  pre: "none" }

              ,{ io: 26, mode: "IN", lbl: "D2",  isA: 0, pre: "none" }
              ,{ io: 25, mode: "IN", lbl: "D3",  isA: 0, pre: "none" }
              ,{ io: 17, mode: "IN", lbl: "D4",  isA: 0, pre: "none" }
              ,{ io: 16, mode: "IN", lbl: "D5",  isA: 0, pre: "none" }
              ,{ io: 27, mode: "IN", lbl: "D6",  isA: 0, pre: "none" }
              ,{ io: 14, mode: "IN", lbl: "D7",  isA: 0, pre: "none" }
              ,{ io: 12, mode: "IN", lbl: "D8",  isA: 0, pre: "none" }
              ,{ io: 13, mode: "IN", lbl: "D9",  isA: 0, pre: "none" }
                    //DigitalInput _D10( 5, "D10");  //  GPIO 5 seems unusable
              ,{ io: 23, mode: "IN", lbl: "D11", isA: 0, pre: "none" }
              ,{ io: 19, mode: "IN", lbl: "D12", isA: 0, pre: "none" }
              ,{ io: 18, mode: "IN", lbl: "D13", isA: 0, pre: "none" } ]; 
  }
 else {

   // IO Configuration
    // ESP32 HUZZAH32
   
    // *** Note :
    //           you can only read analog inputs on ADC #1 once WiFi has started *** //
    //           PWM is possible on every GPIO pin
    
    //DigitalInput _A0( 26, "A0");  // A0 DAC2 ADC#2 not available when using wifi 
    //DigitalInput _A1( 25, "A1");  // A1 DAC1 ADC#2 not available when using wifi
 /*   AnalogInput  _A2( 34, "GAZ");  // A2      ADC#1   Note it is not an output-capable pin! 
    AnalogInput  _A3( 39, "LIGHT");  // A3      ADC#1   Note it is not an output-capable pin! 
    AnalogInput  _A4( 36, "SOIL1");  // A4      ADC#1   Note it is not an output-capable pin! 
    DigitalInput _A5(  4, "HEAT1");  // A5      ADC#2  TOUCH0 
    DigitalInput _SCK( 5, "FAN1");  // SPI SCK
    DigitalInput _MOSI( 18, "PUMP1");   // MOSI
    DigitalInput _MISO( 19, "PUMP2");  // MISO
    // GPIO 16 - RX
    // GPIO 17 - TX
    PullupInput _D21( 21, "BLUE"); 
    // 23		            BMP280	            SDA
    // 22		            BMP280	            SCL
    DigitalInput _A6( 14, "DHT");  // A6 ADC#2
    // 32		                                A7 can also be used to connect a 32 KHz crystal
    DigitalInput _A8( 15, "MOVE"); // 15		A8 ADC#2
    // 33		             	                A9
    // 27		            	                A10 ADC#2
    // 12	            	          	        A11 ADC#2 This pin has a pull-down resistor built into it, we recommend using it as an output only, or making sure that the pull-down is not affected during boot
    DigitalOutput _A12( 13, "LED1");  // A12  ADC#2  Builtin LED
    AnalogInput  _A13( 35, "VBAT");   // A13 This is general purpose input #35 and also an analog input, which is a resistor divider connected to the VBAT line   Voltage is divided by 2 so multiply the analogRead by 2
    */

 /*  config = [{ pinMode: "INPUT", gpio: 34,  label: "A2",  isAnalog: true, preConfig: "none" } 
              ,{ pinMode: "INPUT", gpio: 39,  label: "A3",  isAnalog: true, preConfig: "none" }
              ,{ pinMode: "INPUT", gpio: 36, label: "A4",    isAnalog: false,  preConfig: "none" }
              ,{ pinMode: "INPUT", gpio: 4,  label: "A5",    isAnalog: false,  preConfig: "none" }
              ,{ pinMode: "INPUT", gpio: 5,  label: "SPI",   isAnalog: false,  preConfig: "none" }
              ,{ pinMode: "INPUT", gpio: 18, label: "MISO",  isAnalog: false,  preConfig: "none" }
              ,{ pinMode: "INPUT", gpio: 19, label: "MOSI",  isAnalog: false,  preConfig: "none" }


              ,{ pinMode: "INPUT_PULLUP", gpio: 21, label: "D21",  isAnalog: false, preConfig: "none" }
              ,{ pinMode: "INPUT", gpio: 14, label: "A6",   isAnalog: false, preConfig: "none" }
              ,{ pinMode: "INPUT", gpio: 15, label: "A8",   isAnalog: false, preConfig: "none" }
              ,{ pinMode: "INPUT", gpio: 13, label: "A12",  isAnalog: false, preConfig: "none" }
              ,{ pinMode: "INPUT", gpio: 35, label: "A13",  isAnalog: true,  preConfig: "none" } ] */
 }


  return config
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

