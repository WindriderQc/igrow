require('dotenv').config();
const IN_PROD = process.env.NODE_ENV === 'production'  
const PORT = process.env.PORT || 3002

const express = require('express'),
session = require('express-session'),
MongoDBStore = require('connect-mongodb-session')(session),
serveIndex = require('serve-index'),
path = require('path'),
cors = require('cors')/*,
rateLimit = require('express-rate-limit')*/

const mqtt = require('./serverMqtt')

const app = express()
app.set('view engine', 'ejs')



//  TODO : mettre un indicateur dans le top menu indiquant si le DataAPI est connecté ou non.
const apiUrl =process.env.DATA_API_URL + (process.env.DATA_API_PORT ? ":" + process.env.DATA_API_PORT : "") //let dAPIUrl = "https://data.specialblend.ca"

async function checkApi(useName, apiurl) {
    try {
        console.log('Checkin API: ' + useName + ' - API url: ' + apiurl)
        const response = await fetch(apiurl);
        console.log('API response: ', response)
        if (response.ok) {
            console.log('\n\n' + useName + ' API is online\n\n');
        } else {
            console.log('\n\n' + useName + ' API is offline\n\n');
        }
    } catch (error) {
        console.log('\n\n' + useName + ' API is offline\n\n');
    }
}


// Call the function and handle the promise
checkApi("Data API", apiUrl).then(() => {
    console.log('Check complete');
}).catch((error) => {
    console.error('Error checking API:', error);//  TODO:   si dataAPI réponds pas, redirect vers error page qui le mentionne
});


const mongoStore = new MongoDBStore({ uri: process.env.MONGO_CLOUD, collection: 'mySessions'}, (err) => { if(err) console.log( 'MongoStore connect error: ', err) } );
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
    //.use(rateLimit({ windowMs: 30 * 1000, max: 1 }))  //  prevents a user to crash server with too many request, altough with ESP32 sending heartbeat fast.. this cannot be set   2023-WTF...  esp are mqtt, should not cause issue
    .use(session(sessionOptions))
    .use(express.static(path.resolve(__dirname, 'public') )) 
    .use('/', require('./routes/main.routes.js')) 
    .use('/login',    require('./routes/login.routes'))
    .use('/Projects',    serveIndex(path.resolve(__dirname, 'public/Projects'), {  'icons': true,  'stylesheet': 'public/css/indexStyles.css' } )) // use serve index to nav folder  (Attention si utiliser sur le public folder, la racine (/) du site sera index au lieu de html


console.log("Launching Express app server")
app.listen(PORT, () => { 
        console.log(`\n\nServer running in ${process.env.NODE_ENV} mode at port ${PORT}`)
        console.log(`\n(Nginx may change public port)`)
        console.log('Press Ctrl + C to exit\n')
    })



const esp32 = require('./esp32')
esp32.setConnectedValidation(1000) //  check every X seconds if devices are still connected

console.log("Launching Mqtt")

mqtt.initMqtt(esp32.msgHandler)






//  TODO:  integrate this sync and file check in nodetools
/*
var Concordance = require('./FilesTools/concordance');
var wordcounts = new Concordance();


var fs = require('fs');

// What are all the files in the directory "data"?
var files = fs.readdirSync('FilesTools');
// Read all the files one by one
for (var i = 0; i  < files.length; i++) {
  var txt = fs.readFileSync('FilesTools/'+files[i], 'utf8');
  wordcounts.process(txt);
}



// Route for sending all the concordance data
app.get('/all', showAll);

function showAll(req, res) {
  // Send the entire concordance
  res.send(wordcounts);
}

// Now a route for data about one word
app.get('/search/:word', showOne);

function showOne(req, res) {
  var word = req.params['word'];

  var reply = { };
  var count = wordcounts.getCount(word);

  // If it's not part of concordance send back a message
  if (count === undefined) {
    reply.status = 'word not found';
  // Otherwise send back the word and count
  } else {
    reply.status = 'success';
    reply.count = count;
  }
  // It's useful to send back the word to
  // so the client can match the count with a given API call
  reply.word = word;

  res.send(reply);
}


var exists = fs.existsSync('additional.json');
var additional;
if (exists) {
  var txt = fs.readFileSync('additional.json', 'utf8');
  additional = JSON.parse(txt);
} else {
    additional = {};
  }




  // Assuming some new word and score is added
additional['new word'] = 5;

// Turn additional back into text
var json = JSON.stringify(additional);

// Write out the file
fs.writeFile('additional.json', json, 'utf8', finished);

// Callback for when file is finished
function finished(err) {
  console.log('Finished writing additional.json');
}


*/

// The client can then access this data with loadJSON().
/*
// Getting all the data
loadJSON('/all', gotAll);

// Getting data for one word -- 'apple'
loadJSON('/search/apple', gotOne);

function gotAll(data) {
// deal with all the data
}

function gotOne(data) {
// deal with the results of the search for a single word
}

*/


