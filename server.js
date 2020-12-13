require('dotenv/config')
const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
app.set('view engine', 'ejs')



//Middlewares
app.use(cors())
app.use(express.urlencoded({ extended: true })) // insures bodyParser
app.use(express.static(__dirname + '/public'));


const IN_PROD = process.env.NODE_ENV === 'production'  // for https channel...  IN_PROD will be true if in production environment
app.use(session({
    name: process.env.SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESS_SECRET,
    //rolling: true,   // force identifier cookie to be set on every response.
    cookie: {
        secure: IN_PROD,
        maxAge: Number(process.env.SESS_LIFETIME),
        sameSite: true
    }
}))



// Connect to DB
console.log("Connecting to DB: " + process.env.DB_CONNECTION)
mongoose.connect( process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }, () => { 
    console.log('connected to db!') 
})



// Import routes
//const postsRoute = require('./routes/posts.js')
//const postsEsp = require('./routes/postsEsp.js')
const mainRoutes = require('./routes/mainRoutes.js')
const users = require('./routes/users.js')
const heartbeats = require('./routes/heartbeats.js')
const alarms = require('./routes/alarms.js')

// Route middleware
//app.use('/api/posts', postsRoute)
//app.use('/api/postsEsp', postsEsp)
app.use('/', mainRoutes)
app.use('/users', users)
app.use('/heartbeats', heartbeats)
app.use('/api/alarms', alarms)


// ROUTES
//app.get('/', (req, res) => {  res.send('SBQC\n')  })


app.listen(process.env.PORT, () => { console.log('DB Server now running at http://0.0.0.0:%s', process.env.PORT)})



console.log("Launching Mqtt")
require('./serverMqtt').initMqtt()