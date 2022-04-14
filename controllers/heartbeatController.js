const Heartbeat = require('../models/heartbeatModel')


// Gets back all the posts
exports.index = (req, res)=> {   
    Heartbeat.find({}, (err, posts) => {   errorCheck(err, res, { status: "success", message: 'Heartbeats retrieved successfully', data: posts  })    })
}


//Get a  post  '/:post_id'
exports.byId = (req, res) => {
    Heartbeat.findById(req.params.post_id, (err, post) =>{ errorCheck(err, res, { status: "success", message: 'Heartbeat retrieved successfully', data: post  })    })   
}


// Submits a post
exports.new = (req, res) => {
    const post = new Heartbeat(req.body)
    post.save((err) =>{  errorCheck(err, res, { status: "success", message: 'Heartbeat loggged successfully', data: post  })    })
}


//Delete a specific post
exports.delete = (req, res) => {
    Heartbeat.deleteOne({ _id: req.params.post_id }, (err, ack) => { errorCheck( err, res, { status: "success", message: 'Post deleted', data: ack  })    })
}


// delete all the posts
exports.deleteAll = (req, res) => {  
    Heartbeat.deleteMany({}, (err, ack) => { errorCheck(err, res, { status: "success", message: 'All Heartbeats deleted', data: ack  })     })
}


// get list of all devices that posted 
exports.devices = (req, res) => {   
    Heartbeat.distinct('sender', (err, devices) => { errorCheck(err, res, { status: "success", message: 'Latest heartbeater devices retrieved', data: devices  })    })     
}




// get last post for a specific device
exports.deviceLatest = async (req, res) => {
    try {
        const latest = await Heartbeat.find({"sender": req.params.esp}).sort({ _id: -1 }).limit(1)
        res.json({ status: "success", message: 'Latest heartbeat retreived', data: latest  })
    } 
    catch (err) {  res.json({ status:'error', message: err})  }
}


// get first post for a specific device
exports.deviceOldest = async (req, res) => {
    try {
        const oldest = await Heartbeat.find({"sender": req.params.esp}).sort({ _id: 1 }).limit(1)
        res.json({ status: "success", message: 'Oldest heartbeat retreived', data: oldest  })
    }
    catch (err) { res.json({ message: err })  }
}



// get a data sample via params
exports.data = async (req, res) => {

    const options = req.params.options.split(',')
    console.log(options)
    const samplingRatio = options[0]
    const espID = options[1]
    const startDate = options[2]
    const ratio = Number(samplingRatio)
    const opt = { ratio, espID, startDate }
    console.log(opt)

    try {
        const data = await Heartbeat.find({ sender: espID, time: { $gt: startDate } }).sort({ time: 1 }).limit(50000)
   
        let ret = [];

        for (let i = 0, len = data.length; i < len; i++) {
            if (i % ratio === 0) {
                ret.push(data[i]);
            }
        }

        console.log("\nSending data...")
        res.json({ status: "success", message: `Data with options ${JSON.stringify(opt)} retreived`, data: ret  })
    }
    catch (err) {  res.json({ status:'error', message: err})  }
}





// helper method
errorCheck = (err, res, successMsg) =>{
    if (err) res.json({ status: "error", message: err }) 
    else     res.json(successMsg)    
}




/*


router.get('/data/latest/:options', verify, async (req, res) => {

    const options = req.params.options.split(',')
    console.log(options)
    const samplingRatio = options[0]
    const espID = options[1]
    const startDate = options[2]
    const ratio = Number(samplingRatio)
    console.log({ ratio, espID, startDate })


    

    for(i=0; i < options.length(); i++)
    {
        const data = await HeartbeatDB.find({
            sender: espID,
            time: { $gt: startDate }
        }).sort({ time: 1 }).limit(50000)

        console.log("\nSending data...")

    }





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
*/
