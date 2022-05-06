require('dotenv').config();
const IN_PROD = process.env.NODE_ENV === 'production'  
const PORT = process.env.PORT || 5000

const express = require('express'),
session = require('express-session'),
MongoDBStore = require('connect-mongodb-session')(session),
serveIndex = require('serve-index'),
path = require('path'),
cors = require('cors')/*,
rateLimit = require('express-rate-limit')*/


const app = express()
app.set('view engine', 'ejs')


const mongoStore = new MongoDBStore({  
    uri: process.env.MONGO_URL,  
    collection: 'mySessions', 
    connectionOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // serverSelectionTimeoutMS: 10000
    }
}, (err) => { if(err) console.log( 'MongoStore connect error: ', err) } );

mongoStore.on('error', (error) => console.log('MongoStore Error: ', error) );


const sessionOptions = {
                          name: process.env.SESS_NAME,
                          resave: false,
                          saveUninitialized: false,
                          secret: process.env.SESS_SECRET,
                          store: mongoStore,
                          cookie: {
                              secure: IN_PROD,
                            //maxAge: Number(process.env.SESS_LIFETIME),    //  TODO: désactivé pour BUG:  apres un logout (destroy session), plus capable de ravoir un cookie envoyé apres le login....       update: semble etre un probleme de persistence apres un redirect
                              sameSite: true
                          }
                        }


console.log("Setting Middlewares & routes")
app
    .use(cors({    origin: '*',    optionsSuccessStatus: 200  }  ))
    .use(express.urlencoded({extended: true, limit: '10mb'}))  //  Must be before  'app.use(express.json)'    , 10Mb to allow image to be sent
    .use(express.json({limit:'10mb'})) // To parse the incoming requests with JSON payloads
    //.use(rateLimit({ windowMs: 30 * 1000, max: 1 }))  //  prevents a user to crash server with too many request, altough with ESP32 sending heartbeat fast.. this cannot be set
    .use(session(sessionOptions))
    .use(express.static(path.resolve(__dirname, 'public') )) 
    .use('/', require('./routes/main.routes.js')) 
    .use('/Projects',    serveIndex(path.resolve(__dirname, 'public/Projects'), {  'icons': true,  'stylesheet': 'public/css/indexStyles.css' } )) // use serve index to nav folder  (Attention si utiliser sur le public folder, la racine (/) du site sera index au lieu de html


console.log("Launching Express app server")
app.listen(PORT, () => { 
        console.log(`\n\nServer running in ${process.env.NODE_ENV} mode at port ${PORT}`)
        console.log(`\n(Nginx may change public port)`)
        console.log('Press Ctrl + C to exit\n')
    })


console.log("Launching Mqtt")
require('./serverMqtt').initMqtt()




//  TODO:   si dataAPI réponds pas, redirect vers error page qui le mentionne