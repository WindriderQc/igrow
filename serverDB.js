
const HeartbeatDB = require('./models/Heartbeat')
const User = require('./models/User')



async function getDevices() 
{
    try {
        const list = await HeartbeatDB.distinct("sender")
        return list
    } 
    catch (err) {   console.log(err)    }
}

async function getUsers() 
{
    try {
        const users = await User.find()
        return users
    } 
    catch (err) {   console.log(err)    }
}


module.exports = {
    getDevices,
    getUsers
  };
  