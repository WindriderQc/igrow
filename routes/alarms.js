const router = require('express').Router()
const Alarm = require('../models/Alarm')
//const User = require('../models/User')
//const verify = require('./verifyToken')

const bodyParser = require('body-parser')
router.use(bodyParser.json())


// Gets back all the posts
router.get('/',  async (req, res) => {
    try{
        //const loggedUser = await User.findbyOne({_id: req.user})
        //console.log(loggedUser)
        const alarms = await Alarm.find()
        res.json(alarms)
    }catch(err) {
        res.json({message:err})
    }
})

router.get('/distinct',  async (req, res) => {
    try{

       const IOs = await Alarm.distinct('io')
    
        res.json(IOs)
    }catch(err) {
        res.json({message:err})
    }
})

router.get('/getLast/:io',  async (req, res) => {
    try{
        const data = await Alarm.find({
            io: req.params.io
        }).sort({ _id: -1 }).limit(1)      //  sort with newest entriers first
    
        console.log(data)
        res.json(data)
    }catch(err) {
        res.json({message:err})
    }
})
/*router.get('/specifics', (req, res) => {
    res.send('We are on specifics')
})*/

// Submits a post
router.post('/', async (req, res) => {
    const log = req.body
     
    try { 
        const alarm = new Alarm(log) 
        const savedAlarm = await alarm.save()
        console.log(savedAlarm)
        res.json(savedAlarm)
    } catch(err) {
        res.json({message: err})
    }
 
})
/*
//Get a specific post
router.get('/:postId', async (req,res) => {
    try {
        const post = await Alarm.findById(req.params.postId)
        res.json(post)
    } 
    catch(err) {
        res.json({message: err})
    }
})

//Delete a specific post
router.delete('/:postId', async (req,res) => {
    try {
        const ack = await Alarm.deleteOne( {_id : req.params.postId } )
        res.json(ack)
    } 
    catch(err) {
        res.json({message: err})
    }
})

// Update a specific post
router.patch('/:postId', async (req,res) => {
    try {
        const ack = await Alarm.updateOne( {_id : req.params.postId }, {$set: {title: req.body.title, description: req.body.description, date: Date.now() } } )
        res.json(ack)
    } 
    catch(err) {
        res.json({message: err})
    }
})*/

module.exports = router