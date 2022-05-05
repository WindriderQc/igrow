const fetch = require('node-fetch'),
 moment = require('moment'),
 configs = require('./esp32configs'),
 apiUrl = process.env.DATA_API + '/api'


let commBuff = []
let registered = []
let lastSavedPost = []
const DB_SAVE_RATIO = 60
const BUFF_MAXSIZE = 125
const DISCONNECT_TIMOUT = 3


const esp32 = {


    getConfig: async (espID) =>    
    {  
        return (configs.find( ({ id }) => id === espID ))  //  TODO : SHOULD BE dans la BD    TODO: return config[0] si espID pas trouvé
    },
    

    setConfig: async (espID, mqttclient) => 
    {
        const t = 'esp32/' + espID + '/config'
        const config = await esp32.getConfig(espID)   
        const c1 =  JSON.stringify(config.config)
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

    register: async (data) =>
    {
        const option = { method: 'PATCH', headers: { "Content-type": "application/json" }, body: JSON.stringify(data)    }
    
        try {
            const rawResponse = await fetch(apiUrl + '/devices/:' + data.sender, option); 
            const r = await rawResponse.json() // const r = await rawResponse.text()
            if(r.status === 'success')  {  console.log('Registering: ', r.data.id)  } else console.log(r.status, r.message ) 
            const resp = await esp32.getRegistered()
            console.log(resp)  //registered = await resp.json()

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
            console.log("New device connected: ")
            esp32.getRegistered() //  update registered list
            commBuff[data.sender] = []
            commBuff[data.sender].push(data)
            console.log("Loading registered:")
            lastSavedPost[data.sender] = data
            await esp32.saveEspPost(data)
        }
        //console.log(commBuff[data.sender].length)
        //console.log(commBuff)
        
        //  will push out oldest post from buffer when max buffer topped
        if(commBuff[data.sender].length >= BUFF_MAXSIZE) commBuff[data.sender].shift()
    }

}


module.exports = {esp32}
//module.exports = {commBuff, registered}