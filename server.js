require('dotenv').config();
const express = require('express'),
session = require('express-session'),
serveIndex = require('serve-index'),
path = require('path'),
rateLimit = require('express-rate-limit'),
mongoose = require('mongoose'),
cors = require('cors')



const IN_PROD = process.env.NODE_ENV === 'production'  // for https channel...  IN_PROD will be true if in production environment

const PORT = process.env.PORT || 5000

const sessionOptions = {
                          name: process.env.SESS_NAME,
                          resave: false,
                          saveUninitialized: false,
                          secret: process.env.SESS_SECRET,
                          cookie: {
                              secure: IN_PROD,
                              maxAge: Number(process.env.SESS_LIFETIME),
                              sameSite: true
                          }
                        }


const app = express()
app.set('view engine', 'ejs')




// Connect to DBs

// mongoose with local DB
mongoose.connect( process.env.DB_CONNECTION, { family: 4, useNewUrlParser: true, useUnifiedTopology: true })// family: 4    skip  default IPV6 connection  and accelerate connection.

mongoose.connection.on('error', console.error.bind(console, 'conn error:'))

mongoose.connection.once('open', function() { 
    console.log('Mongoose connected to db: ' + process.env.DB_CONNECTION) 
   
    mongoose.connection.db.listCollections().toArray( (err, collections) => {   //trying to get collection names
        console.log("LocalDB collections:")
        console.log(collections); // [{ name: 'dbname.myCollection' }]
       // module.exports.Collection = collections;
    });

})



//Mongodb Client setup  with CloudDB
const mongo = require('./mongo')

mongo.connectDb('test', async (mongodb) =>{    // dbServ, test, admin, local 

    app.locals.collections = [] 
    const list = await mongo.getCollectionsList()

    console.log("Assigning Collections to app.locals :")
    for(coll of list) {
        console.log(coll.name)
        app.locals.collections[coll.name] = mongo.getDb(coll.name)
    }
    //db.createCollection('server')
    app.locals.collections.server.insertOne({ name: "dbServer boot", date: Date.now() })   //   TODO:  Server may not exist

})


/*
// Set default API response  
//app.get('/', (req, res) => {  res.send('SBQC\n')  })
app.get('/', function (req, res) {
res.json({
    status: 'dbServ node server active',
    message: 'Welcome to SBQC DB server'
})
})
app.use((error, req, res, next) => {
res.status(500);
res.json({
message: error.message
})
})
*/

//Middlewares & routes
app
    .use(cors())    //.use(cors({    origin: '*',    optionsSuccessStatus: 200  }  ))
    .use(express.urlencoded({extended: true, limit: '10mb'}))  //  Must be before  'app.use(express.json)'    , 10Mb to allow image to be sent
    .use(express.json({limit:'10mb'})) // To parse the incoming requests with JSON payloads
    //.use(rateLimit({ windowMs: 30 * 1000, max: 1 }))  //  prevents a user to crash server with too many request, altough with ESP32 sending heartbeat fast.. this cannot be set
    .use(session(sessionOptions))
    .use(express.static(path.resolve(__dirname, 'public') )) 
    .use('/Files',    serveIndex(path.resolve(__dirname, 'public/Files'), {  'icons': true,  'stylesheet': 'public/css/indexStyles.css' } )) // use serve index to nav folder  (Attention si utiliser sur le public folder, la racine (/) du site sera index au lieu de html

    .use('/', require('./routes/mainRoutes.js'))
    .use('/login', require('./routes/login.routes.js'))
    .use('/heartbeats', require('./routes/heartbeats.js'))
    //.use('/iot/alarms', require('./routes/alarms.js'))
    .use('/api', require("./routes/api.routes"))
    //app.use('/geo', require("./routes/geo.routes"))
    .use('/meows', require("./routes/meows.routes"))
    .use('/server', require("./routes/server.routes"))
 //.use('/keeper', require("./routes/keeper.routes"))

// Launching server
    .listen(PORT, () => { 
        console.log(`\n\nServer running in ${process.env.NODE_ENV} mode at port ${PORT}`)
        console.log('Press Ctrl + C to exit\n')
    })



console.log("Launching Mqtt")
require('./serverMqtt').initMqtt()


let liveDatas = require('./liveData.js')
console.log("Setting live data  :  v" + liveDatas.data.version)
