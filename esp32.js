const fetch = require('node-fetch'),
 moment = require('moment'),
 apiUrl = process.env.DATA_API + '/api'
 //configs = require('./esp32configs')
 


let commBuff = []
let registered = []
let lastSavedPost = []
const DB_SAVE_RATIO = 60
const BUFF_MAXSIZE = 125
const DISCONNECT_TIMOUT = 3


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
        if(deviceId == 'ESP_38990') {

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
            const resp = await esp32.getRegistered()
           // console.log('getting registered:', resp)  //registered = await resp.json()


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
            return registered
        }
        catch (err) { console.log(err) }
    },

    
    timeSince: (timeStamp, units="second") => {   
        const now = moment()
        const secs = now.diff(timeStamp, units);
        return secs
    },

    validConnected: () => {
        registered.forEach((device) => {
            if(commBuff[device.id]) {

                const last = moment(commBuff[device.id][commBuff[device.id].length -1].time)
                const seconds = esp32.timeSince(last, 'second') 
            // console.log(seconds)  
                if(seconds >= DISCONNECT_TIMOUT) {
                    if (device.connected) console.log(device.id + ' disconnected!!')
                    device.connected = false
                } 
                else device.connected = true
            }
        })
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

           registered.forEach((device) => {
               if(device.id === data.sender) device.connected = true  //   TODO:  BAD si bcp de device, long loop a chaque msg
           })
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


setInterval(esp32.validConnected, 1000)

module.exports = esp32
//module.exports = {commBuff, registered}