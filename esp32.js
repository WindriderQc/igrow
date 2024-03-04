const fetch = require('node-fetch'),
 moment = require('moment'),
 apiUrl = "http://" + process.env.DATA_API_IP + ":" + process.env.DATA_API_PORT
 //configs = require('./esp32configs')
 
let _mqttClient
let commBuff = []
let registered = []
let lastSavedPost = []
const DB_SAVE_RATIO = 60
const BUFF_MAXSIZE = 125
const DISCONNECT_TIMOUT = 3

/*

{  status: 'Data server connected to iGrow database',  
                message: 'Welcome to SBQC Data API  💻 🖱️ 🦾   Try 192.168.1.33:3003/.....', 
                data: { APIs: "db, alarms, contact, devices, heartbeat, users" }   
            }

            */


const esp32 = {

/*
    getConfig: async (espID) =>    
    {  
        return (configs.find( ({ id }) => id === espID ))  //  TODO : SHOULD BE dans la BD    TODO: return config[0] si espID pas trouvé
    },*/
    

    setConfig: (espID, mqttclient) => 
    {
        const found = registered.find(element => element.id == espID);
        const config = found.config   
       
        const c1 =  JSON.stringify(config)
        //console.log('Sending config to esp: ', espID, 'config: ', c1)

        const t = 'esp32/' + espID + '/config'
        mqttclient.publish(t, c1 )
    },


    setAlarms: async(espID, mqttclient) => 
    {
        const rawResponse = await fetch(apiUrl + '/alarms/' + espID);   
        const alarms = await rawResponse.json()
        for( als of alarms) {
            mqttclient.publish('esp32/' + espID + '/io/sunrise', "" + als.io + ":" + moment(als.tStart).format('HH:mm:ss'))
            mqttclient.publish('esp32/' + espID + '/io/nightfall',"" + als.io + ":" + moment(als.tStop).format('HH:mm:ss'))
        }
    },


    saveEspPost: async (data) =>
    {
        const option = { method: 'POST', headers: { "Content-type": "application/json" }, body: JSON.stringify(data)    }
    
        try {
            const rawResponse = await fetch(apiUrl + '/heartbeats', option);  // const r = await rawResponse.text()
            const r = await rawResponse.json()
            if(r.status === 'success')  {/* // console.log(r.data.sender) */ } else console.log(r.status, r.message ) 
        }
        catch (err) { console.log(err) }
    },

    register: async (deviceId) =>
    {
        let data
        if(deviceId == 'ESP_38990') {    //  TODO:    put config in db....

            data = { type: 'esp32', id: deviceId, lastBoot: Date.now(), connected: true, zone: "atelier", 
                            config: [
                                    { io: "2",  mode: "IN", lbl: "A0",  isA: "0", pre: "none", name: "" } 
                                    ,{ io: "4",  mode: "IN", lbl: "A1",  isA: "0", pre: "none", name: "" }
                                    ,{ io: "35", mode: "INPULL", lbl: "A2",  isA: "1",  pre: "none" , name: ""}
                                    ,{ io: "34", mode: "INPULL", lbl: "A3",  isA: "1",  pre: "none", name: "" }
                                    ,{ io: "36", mode: "INPULL", lbl: "A4",  isA: "1",  pre: "none", name: "" }
                                    ,{ io: "39", mode: "INPULL", lbl: "A5",  isA: "1",  pre: "none", name: "" }
                        
                                    ,{ io: "26", mode: "IN", lbl: "D2",  isA: "0", pre: "none", name: "" }
                                    ,{ io: "25", mode: "IN", lbl: "D3",  isA: "0", pre: "none" , name: ""}
                                    ,{ io: "17", mode: "IN", lbl: "D4",  isA: "0", pre: "none" , name: ""}
                                    ,{ io: "16", mode: "IN", lbl: "D5",  isA: "0", pre: "none", name: "" }
                                    ,{ io: "27", mode: "IN", lbl: "D6",  isA: "0", pre: "none" , name: ""}
                                    ,{ io: "14", mode: "IN", lbl: "D7",  isA: "0", pre: "none", name: "" }
                                    ,{ io: "12", mode: "IN", lbl: "D8",  isA: "0", pre: "none", name: "" }
                                    ,{ io: "13", mode: "IN", lbl: "D9",  isA: "0", pre: "none", name: "" }
                                        //DigitalInput _D10( 5, "D10");  //  GPIO 5 seems unusable
                                    ,{ io: "23", mode: "IN", lbl: "D11", isA: "0", pre: "none" , name: ""}
                                    ,{ io: "19", mode: "IN", lbl: "D12", isA: "0", pre: "none", name: "" }
                                    ,{ io: "18", mode: "IN", lbl: "D13", isA: "0", pre: "none", name: "" } ]
            }

        }
        else if(deviceId == 'ESP_15605') {

            data = { type: 'esp32', id: deviceId, lastBoot: Date.now(), connected: true, zone: "atelier", 
                                config:
                                [  
                                    { io: "34",  mode: "IN", lbl: "A2",  isA: "1", name: "" } 
                                    ,{ io: "39",  mode: "IN", lbl: "A3",  isA: "1", name: ""}
                                    ,{ io: "36", mode: "IN", lbl: "A4",  isA: "0", name: "" }
                                    ,{ io: "4", mode: "IN", lbl: "A5",  isA: "0", name: ""}
                                    ,{ io: "21", mode: "OUT", lbl: "D3",  isA: "0", name: "" }
                                        // ,{ io: "6", mode: "IN", lbl: "SPI",  isA: "0" }
                                        // ,{ io: "18", mode: "IN", lbl: "MISO",  isA: "0" }
                                        // ,{ io: "19", mode: "IN", lbl: "MOSI",  isA: "0" } 
                                    ,{ io: "13", mode: "OUT", lbl: "A12",  isA: "0", name: "BUILTINLED" }
                                    ,{ io: "14", mode: "IN", lbl: "D4",  isA: "0", name: "" }
                                    ,{ io: "15", mode: "IN", lbl: "D5",  isA: "0", name: "" }
                                    ,{ io: "13", mode: "IN", lbl: "D6",  isA: "0", name: ""}
                                    ,{ io: "35", mode: "IN", lbl: "D7",  isA: "0", name: ""} ]      
                    }
        
        } else data = { type: 'esp32', id: deviceId, lastBoot: Date.now(), connected: true, zone: 'bureau',
                                config: [  
                                        { io: "34",  mode: "IN", lbl: "A2",  isA: "1", name: "" } 
                                        ,{ io: "39",  mode: "IN", lbl: "A3",  isA: "1", name: "" }
                                        ,{ io: "36", mode: "IN", lbl: "A4",  isA: "0", name: "" }
                                        ,{ io: "4", mode: "OUT", lbl: "A5",  isA: "1", name: "Fan" }
                                        ,{ io: "21", mode: "OUT", lbl: "D3",  isA: "0", name: "Lamp 1" }     
                                        ,{ io: "14", mode: "OUT", lbl: "D4",  isA: "0", name: "Lamp 2" }
                                        ,{ io: "15", mode: "OUT", lbl: "D5",  isA: "0", name: "Pump" }
                                        ,{ io: "13", mode: "OUT", lbl: "D6",  isA: "0", name: "Heat" }
                                        ,{ io: "35", mode: "IN", lbl: "D7",  isA: "0", name: "" } 
                                        ,{ io: "13", mode: "OUT", lbl: "A12",  isA: "0", name: "BUILTINLED" }  ] 
                                
                    }
        

        

        const option = { method: 'PATCH', headers: { "Content-type": "application/json" }, body: JSON.stringify(data)    }
    
        try {
            const rawResponse = await fetch(apiUrl + '/devices/:' + deviceId, option); 
            const r = await rawResponse.json() // const r = await rawResponse.text()
          
            if(r.status === 'success')  {  console.log('Registering: ', r.data.id)  } else console.log(r.status, r.message ) 
            registered = await esp32.getRegistered()
            console.log('updating registered:', registered.id)  //
          


        }
        catch (err) { console.log(err) }
    },

    getRegistered: async () =>
    {    
        try {
            const rawResponse = await fetch(apiUrl + '/devices'); 
            const r = await rawResponse.json() // const r = await rawResponse.text()
            registered = r.data
           
            if(r.status === 'success')  {  console.log('Registered list: ', r.data)  } else console.log(r.status, r.message ) 
            registered = esp32.validConnected()  // make sure connections are known if its called before first auto actualization of connected
            return registered
        }
        catch (err) { console.log('Error fetching registered. Is Data API online?', err); }
    },

    
    timeSince: (timeStamp, units="second") => {   
        const now = moment()
        const secs = now.diff(timeStamp, units);
        return secs
    },

    validConnected: () => {
        registered.forEach((device) => {
            if(commBuff[device.id]) {
                console.log(commBuff[device.id][commBuff[device.id].length -1])
                const last = moment(commBuff[device.id][commBuff[device.id].length -1].time)
                const seconds = esp32.timeSince(last, 'second') 
            // console.log(seconds)  
                if(seconds >= DISCONNECT_TIMOUT) {
                    if (device.connected) console.log(device.id + ' disconnected!!')
                    device.connected = false  //  device in commBuff but not posted since timeout
                
                    _mqttClient.publish('esp32/' + device.id + '/disconnected', JSON.stringify(device) )

                } 
                else device.connected = true
            }
            else device.connected = false   //   device not in commBuff
        })
        if(registered == null) {console.log('correcting registered'); registered = [];}
        return registered
    },

    setConnectedValidation: (mqttClient, interval) => {

        _mqttClient = mqttClient
        setInterval(esp32.validConnected, interval)

    },



    receiveMessage: async (data) =>
    {
        
        if(commBuff[data.sender])  { 
            const last = moment(lastSavedPost[data.sender].time).format('YYYY-MM-DD HH:mm:ss') 
            const seconds = esp32.timeSince(last, 'second')     
            const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') 
           
          //  console.log(now + " - " + last + " = " + seconds)
                  
            commBuff[data.sender].push(data)

            if(seconds >= DB_SAVE_RATIO) {
                lastSavedPost[data.sender] = data
                await esp32.saveEspPost(data)
            }
        }
        else {    
            //  First message received for this sender
            console.log("device connected: ", data.sender)
           
         
            commBuff[data.sender] = []
            commBuff[data.sender].push(data)
            lastSavedPost[data.sender] = data
            await esp32.saveEspPost(data)
        }
        //console.log(commBuff[data.sender].length)
        //console.log(commBuff)
        
        //  will push out oldest post from buffer when max buffer topped
        if(commBuff[data.sender].length >= BUFF_MAXSIZE) commBuff[data.sender].shift()
    }

}




module.exports = esp32
//module.exports = {commBuff, registered}



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




