let router = require('express').Router()

// Set default API response
router.get('/', function (req, res) {
    res.json({
        status: 'dbServ API active',
        message: 'Welcome to SBQC API'
    })
})

router.get('/hello', function (req, res) {
    res.send('hello from SBQC API')
})



/////////////////////////////////////////////////////////////////////////////////////////////////////
const contactController = require('../controllers/contactController')

// Contact routes
router.route('/contacts')
    .get(contactController.index)
    .post(contactController.new)

router.route('/contacts/:contact_id')
    .get(contactController.view)
    .patch(contactController.update)
    .put(contactController.update)
    .delete(contactController.delete)



const userController = require('../controllers/userController')

router.post("/users/test", async (req, res) => {
    console.log("test");
    res.header("auth-test", "yoyo").send("test good");  //  testing custom header 
    })

router.route('/users')
    .get(userController.index)
    .post(userController.new)  

router.route('/users/:user_id')
    .get(userController.view)
    .patch(userController.update)
    .put(userController.update)
    .delete(userController.delete)



const deviceController = require('../controllers/deviceController')

router.route('/devices')
    .get(deviceController.index)
 //   .post(deviceController.new)  //  use patch instead which will create or update

router.route('/devices/:id')
    .get(deviceController.readOne)
    .patch(deviceController.update)
    .delete(deviceController.deleteOne)

router.route('/devices/deleteAll').get(deviceController.deleteAll)    



const heartbeatController = require('../controllers/heartbeatController')

router.route('/heartbeats')
    .get(heartbeatController.index)
    .post(heartbeatController.new)

router.route('/heartbeats/deleteAll').get(heartbeatController.deleteAll)    
router.route('/heartbeats/devices').get(heartbeatController.devices)
router.route('/heartbeats/deviceLatest/:esp').get(heartbeatController.deviceLatest)
router.route('/heartbeats/deviceOldest/:esp').get(heartbeatController.deviceOldest)
router.route('/heartbeats/data/:options').get(heartbeatController.data)

router.route('/heartbeats/:post_id')
    .get(heartbeatController.byId)
    .delete(heartbeatController.delete)




const alarmController = require('../controllers/alarmController')

router.route('/alarms')
    .get(alarmController.index)
    .post(alarmController.post)  
    .patch(alarmController.update)

router.route('/alarms/:espID,io').get(alarmController.getEspIO)
router.route('/alarms/:espID').get(alarmController.getbyEsp)







const fetch = require('node-fetch')
let nodeTools = require('../nodeTools')
const getMqtt = require('../serverMqtt').getMqttClient
const moment = require('moment')


router.route('/alarms/setAlarm').post(async (req, res) => { // TODO:  devrait etre défini ailleur ptete?

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
        const response = await fetch(process.env.API_URL + "/api/alarms", option)
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


// Export API routes
module.exports = router