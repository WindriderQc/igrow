const fetch = require('node-fetch'),
 moment = require('moment'),
 configs = require('./esp32configs'),
 apiUrl = process.env.API_URL + '/api'


let commBuff = []

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

    
    receiveMessage: async (data) =>
    {
        commBuff[data.sender] = commBuff[data.sender] + data

        console.log(commBuff)
    }

}

module.exports = esp32