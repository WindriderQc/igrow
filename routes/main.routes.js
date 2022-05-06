const router = require('express').Router()
const fetch = require('node-fetch')
//const verify = require('./verifyToken')
const moment = require('moment')

const espConfigs = require('../esp32configs')
const esp32 = require('../esp32')
const getMqtt = require('../serverMqtt').getMqttClient
const Tools = require('../nodeTools')
Tools.readFile("greetings.txt")




const apiUrl = process.env.DATA_API
const iGrowUrl = process.env.IGROW_IP     //  TODO:  devrait juste check son IP, pas besoin de .env pour ca
const mqttUrl = "ws://" + process.env.MQTT_SERVER_IP + ":9001" 
const mqttinfo = JSON.stringify({url: mqttUrl, user: process.env.MQTT_USER, pass: process.env.MQTT_PASS })


////   free routes

router.get("/", async (req, res) => { 
    const response = await fetch(apiUrl + '/api/heartbeats/devices')
    const list = await response.json()
    console.log(list)
    res.render('iot', { mqttinfo: mqttinfo, devices: list.data })
   // res.render('index',    { name: req.session.email }) 
}) 

router.get('/index',  async (req, res) => {  
    const response = await fetch(apiUrl + '/api/heartbeats/devices')
    const list = await response.json()
    console.log(list)
    res.render('iot', { mqttinfo: mqttinfo, devices: list.data })
})

router.get("/iGrow", (req, res) => {  res.send('Hello')  })

router.get('/empty', (req, res) => {  res.render('empty') })

router.get('/cams',  (req, res) => {  res.render('cams')  })




router.get('/device',  async (req, res) => {
   
    //const url = `${apiUrl}/database/list?skip=${params.skip}&limit=${params.limit}&sort=${params.sort}&collection=${params.collection}`
    const registered = await esp32.getRegistered()

    if(!registered.length) {
        console.log('No devices registered yet!!!!! Cannot display device page, redirecting....')
        res.redirect('/iot')
    }
    else {
        let selectedDevice = req.session.selectedDevice ? req.session.selectedDevice : registered[0].id  //  default on 1st device if none is saved in session
        selectedDevice = req.query.deviceID ? req.query.deviceID : selectedDevice // selection from query superceed saved session
        console.log(selectedDevice)
    
        const response2 = await fetch(apiUrl + "/api/alarms")
        const alarmList = await response2.json()

    
        const devices =  registered 
        let selDevice
        registered.forEach(device =>{ if(device.id == selectedDevice) {  selDevice = device }  })
        console.log('Selected Device:', selDevice.config[0])

        res.render('device', { mqttinfo: mqttinfo, devices: devices, selected: selectedDevice, device: selDevice, alarmList: alarmList, apiUrl: apiUrl, iGrowUrl: iGrowUrl })
    }

   
})


router.get('/graphs',  async (req, res) => { 


    const response = await fetch(apiUrl + "/api/devices")
    const result = await response.json()
    const list = result.data
    let selectedDevice = req.session.selectedDevice ? req.session.selectedDevice : list[0].id  // req.query.deviceID ? req.query.deviceID : list[0]  
    console.log('loading graf: ', selectedDevice )
    

    const registered = await esp32.getRegistered()
    const devices = { list, registered }

    res.render('graphs',{ mqttinfo: mqttinfo, devices: devices, selected: selectedDevice, apiUrl: apiUrl })
})


router.post('/selectDevice', async (req, res) => {

    req.session.selectedDevice = req.body.selected
    console.log('Receiving selection: ' , req.body.selected)
    req.session.save(async (err) => { 
        if(err) console.log('Session error: ', err)
       // console.log(req.session)
        res.redirect('/graphs')
    })

})


router.get('/settings',  async (req, res) => {

    const response = await fetch(apiUrl + "/api/users")
    const result = await response.json()
    const users = result.data

    const response2 = await fetch(apiUrl + "/api/devices")
    const result2 = await response2.json()
    const devices = result2.data

    const response3 = await fetch(apiUrl + "/api/alarms")
    const result3 = await response3.json()
    const alarms = result3.data

    res.render('settings', {users: users, devices: devices, alarms: alarms})
    
})


router.get('/iot',  async (req, res) => {
  
    const response = await fetch(apiUrl + '/api/heartbeats/devices')
    const list = await response.json()
    console.log(list)

    res.render('iot', { mqttinfo: mqttinfo, devices: list.data })
})

router.get('/database',  async (req, res) => {
    const response = await fetch(apiUrl+'/database/collectionList')
    const list = await response.json()
    console.log('Sending collection list to client: ', list)
    res.render('database', {collectionList: JSON.stringify(list) })
})

router.get('/weather/:latlon', async (req, res) => {
    /* const latlon = req.params.latlon.split(',')
     const lat = latlon[0]
     const lon = latlon[1]
     const sky_url = `https://api.darksky.net/forecast/7d6708021ee4840eb38d457423ab8a9a/${lat},${lon}`
     //const sky_url = 'https://api.darksky.net/forecast/7d6708021ee4840eb38d457423ab8a9a/0,0'
                   console.log(sky_url)             
     const fetch_response = await fetch(sky_url)
     const data = await fetch_response.json() 
     //console.log(data)
     res.json(data)*/

    const latlon = req.params.latlon.split(',');
    const lat = latlon[0];
    const lon = latlon[1];
    console.log(lat, lon);
    const api_key = process.env.API_KEY;
    console.log(api_key)
    const weather_url = `https://api.darksky.net/forecast/${api_key}/${lat},${lon}/?units=si`;
    const weather_response = await fetch(weather_url);
    const weather_data = await weather_response.json();

    const aq_url = `https://api.openaq.org/v1/latest?has_geo=true&coordinates=${lat},${lon}&radius=100000&order_by=distance`;

    //const aq_url = `https://api.openaq.org/v1/latest?coordinates=0,0`;
    const aq_response = await fetch(aq_url);
    const aq_data = await aq_response.json();

    console.log(aq_url)
    console.log(aq_data)

    const data = {
        weather: weather_data,
        air_quality: aq_data
    };
    res.json(data);


})



router.get('/deviceLatest/:esp',  async (req, res) => {


    let option = {
        method: 'GET',
        headers: {
            'auth-token': req.session.userToken
        }
    }

    try {
        const response = await fetch(apiUrl + "/api/heartbeats/deviceLatest/" + req.params.esp, option)
        const respData = await response.json()
        const data = respData.data[0]
        //console.log(data)

        if (!data) {
            const message = "Could not get data";
            return res.status(400).send(message);
        }
        else {

            let now =  new moment()
            let stamp =  new moment(data.time).format('YYYY-MM-DD HH:mm:ss') 
            let duration = new moment.duration(now.diff(stamp)).asHours();
     
            data.lastConnect = duration

            if(data.wifi != -100) {
                 if(duration > 0.05)  
                 {
                    console.log('Device disconnected !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                    data.wifi   = -100
                    delete data._id
                    let dat = JSON.stringify(data)
                    console.log(dat)
                    let mq = getMqtt()
                    mq.publish('esp32/alive/'+req.params.esp, dat)  //  server sends a mqtt post on behalf of esp to log a last wifi -100 signal in db.
                 }
             }

            res.json(data)
        }
    }
    catch (err) {
        console.error(err)
    }


})


router.get('/data/:options',  async (req, res) => {

    const options = req.params.options.split(',')
    const samplingRatio = options[0]
    const espID = options[1]
    const dateFrom = options[2]
    const ratio = Number(samplingRatio)
    console.log({ ratio, espID, dateFrom })


    req.session.selectedDevice = espID

    let option = { method: 'GET', headers: { 'auth-token': req.session.userToken  }    }

    try {
        const response = await fetch(apiUrl + "/api/heartbeats/data/" + samplingRatio + "," + espID + ',' + dateFrom, option)
        const respData = await response.json()
        const data = respData.data
        res.json(data)
    }
    catch (err) {
        console.error(err)
        return res.status(400).send("Could not get data");
    }

})


router.post('/set_io', (req, res) => {

    let msg = 'esp32/' + req.body.sender + '/io/' + req.body.io_id + '/' + (req.body.io_state === 'ON' ? 'on' : 'off')
    console.log('Setting IO: ' + msg)
    let mq = getMqtt()
    mq.publish(msg, moment().format('YYYY-MM-DD HH:mm:ss'))

  //  res.redirect("/ioCard.html?io_id=" + req.body.io_id + "&name_id=" + req.body.name_id)
    res.redirect('/iot')
})




let nodeTools = require('../nodeTools')


router.route('/alarms/setAlarm').post(async (req, res) => { 

    console.log('post received: Set_alarm')
    //console.log(JSON.stringify(req.body))

    let als = {}
    als.espID =   req.body.device_id //'ESP_35030'  //  'ESP_15605'    ESP_35030
    als.io = req.body.io_id
    als.tStart = req.body.tStart //moment(req.body.tStart).format('YYYY-MM-DD HH:MM:SS')
    als.tStop = req.body.tStop 

    let option = {
        method: 'POST',
        headers: {
            'auth-token': req.session.userToken ,
            'Content-type': 'application/json'   
        },
        body: JSON.stringify(als)
    }
    try {
        const response = await fetch(process.env.DATA_API + "/api/alarms", option)
        const data = await response.json()
     
        if (nodeTools.isObjEmpty(data)) {
            const message = "Error saving alarm";
            console.log(message)
            //return res.status(400).send(message);
        }
        else {  //  send new alarm to already connected ESP.  Non connected ESP will receive the alarm at next boot.
            let mq = getMqtt()
            let topic = 'esp32/' + als.espID + '/io' 
            let startTime = moment(als.tStart).local().format('HH:mm:ss')
            let stopTime = moment(als.tStop).local().format('HH:mm:ss')
            mq.publish('esp32/' + als.espID + '/io/sunrise', als.io + ":" + startTime)
            mq.publish('esp32/' + als.espID + '/io/nightfall', als.io + ":" + stopTime)
            console.log({topic, startTime, stopTime})
        }

    }
    catch (err) {
        console.error(err)
    }

    req.session.selectedDevice = als.espID

    res.redirect("/device")

})





module.exports = router;