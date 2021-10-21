const router = require('express').Router()
const HeartbeatDB = require('../models/Heartbeat')
const verify = require('./verifyToken')

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//const bodyParser = require("body-parser"); //  requis sinon le body est vide...!?
//router.use(bodyParser.json());
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// Gets back all the posts
router.get('/', verify, async (req, res) => {
    try {
        //const loggedUser = await User.findbyOne({_id: req.user})
        //console.log(loggedUser)
        console.log('getting Heartbeat posts')
        const posts = await HeartbeatDB.find()
        console.log(posts)
        res.json(posts)
    } catch (err) {
        res.json({ message: err })
    }
})


// Submits a post
router.post('/', async (req, res) => {
    const log = req.body
    const post = new HeartbeatDB(log)

    try {
            const savedPost = await post.save() 
        // console.log(savedPost)
            res.json(savedPost)
        } catch (err) {
            res.json({ message: err })
    }

})

//Get a specific post
//router.get('/specific/:postId', verify, async (req, res) => {
router.get('/specific/:postId', verify, async (req, res) => {
    try {
        const post = await HeartbeatDB.findById(req.params.postId)
        res.json(post)
    }
    catch (err) {
        res.json({ message: err })
    }
})

//Delete a specific post
router.delete('/:postId', verify, async (req, res) => {
    try {
        const ack = await HeartbeatDB.deleteOne({ _id: req.params.postId })
        res.json(ack)
    }
    catch (err) {
        res.json({ message: err })
    }
})


// delete all the posts
router.get('/deleteAll', verify, async (req, res) => {
    try {

        console.log('Empty Heartbeat DB')
        const posts = await HeartbeatDB.deleteMany({})
        console.log(posts)
        res.json(posts)
    } catch (err) {
        res.json({ message: err })
    }
})


// get list of all devices that posted 
router.get('/devices',  async (req, res) => {   //verify,
    try {
        const posts = await HeartbeatDB.distinct("sender")
        console.log(posts)
        res.json(posts)
    } catch (err) {
        res.json({ message: err })
    }
})


router.get('/deviceLatest/:esp', verify, async (req, res) => {
    try {
        const latest = await HeartbeatDB.find({"sender": req.params.esp}).sort({ _id: -1 }).limit(1)
        //console.log(latest)
        res.json(latest)
    } catch (err) {
        res.json({ message: err })
    }
})

router.get('/deviceOldest/:esp', verify, async (req, res) => {
    try {
        const latest = await HeartbeatDB.find({"sender": req.params.esp}).sort({ _id: 1 }).limit(1)
        console.log(latest)
        res.json(latest)
    } catch (err) {
        res.json({ message: err })
    }
})

router.get('/data/:options', verify, async (req, res) => {

    const options = req.params.options.split(',')
    console.log(options)
    const samplingRatio = options[0]
    const espID = options[1]
    const startDate = options[2]
    const ratio = Number(samplingRatio)
    console.log({ ratio, espID, startDate })

    try {
        const data = await HeartbeatDB.find({
            sender: espID,
            time: { $gt: startDate }
        }).sort({ time: 1 }).limit(50000)

        console.log("\nSending data...")

        let ret = [];

        for (let i = 0, len = data.length; i < len; i++) {
            if (i % ratio === 0) {
                ret.push(data[i]);
            }
        }
        res.json(ret)
    }
    catch (err) {
        res.json({ message: err })
    }
})


router.get('/data/latest/:options', verify, async (req, res) => {

    const options = req.params.options.split(',')
    console.log(options)

    for(i=0; i < options.length(); i++)
    {
        const data = await HeartbeatDB.find({
            sender: espID,
            time: { $gt: startDate }
        }).sort({ time: 1 }).limit(50000)

        console.log("\nSending data...")

    }



    const samplingRatio = options[0]
    const espID = options[1]
    const startDate = options[2]
    const ratio = Number(samplingRatio)
    console.log({ ratio, espID, startDate })

    try {
        const data = await HeartbeatDB.find({
            sender: espID,
            time: { $gt: startDate }
        }).sort({ time: 1 }).limit(50000)

        console.log("\nSending data...")

        let ret = [];

        for (let i = 0, len = data.length; i < len; i++) {
            if (i % ratio === 0) {
                ret.push(data[i]);
            }
        }
        res.json(ret)
    }
    catch (err) {
        res.json({ message: err })
    }
})

module.exports = router