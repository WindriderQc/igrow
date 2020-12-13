
const express = require('express')
const router = express.Router()
const fetch = require('node-fetch');
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const verify = require('./verifyToken')
const { registerValidation, loginValidation } = require('../validation')

const bodyParser = require("body-parser")
router.use(bodyParser.json({ limit: '10mb', extended: true }))
router.use(bodyParser.urlencoded({ extended: true }))


const apiUrl = process.env.API_URL


const redirectLogin = (req, res, next) => {  //console.log(req.session)
    if (!req.session.userToken) {
        res.redirect('/login')
    } else {
        next()
    }
}


router.get("/register", (req, res) => {
    res.render('partials/register');
})

router.post("/register", async (req, res) => {
    const result = {
        user: req.body.name,
        email: req.body.email,
        message: ""
    }

    //  Validate entry form before user creation
    const { error } = registerValidation(req.body)
    if (error) {
        result.message = error.details[0].message
        return res.status(400).send(result)
    }

    // Check if user exist
    const emailExist = await User.findOne({ email: req.body.email })
    if (emailExist) {
        result.message = "Email already exists"
        return res.status(400).send(result)
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(req.body.password, salt)

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword
    })

    try {
        const savedUser = await user.save()
        result.user = savedUser.id
        result.message = 'Success'
        res.redirect('/')
    } 
    catch (err) {   
        console.log(result.message)
        res.redirect('/register')   
    }
})



router.post('/login', async (req, res) => {  console.log('login request: ' + req.body.email)

    try {
        const result = {
            email: req.body.email,
            message: "",
            token: ""
        }
  
        //  Validate entry form before login
        const { error } = loginValidation(req.body)
        if (error) {
        
            result.message = error.details[0].message
            console.log(result.message)
            return res.status(400).send(result)
        }
    
        // Check if user exist
        const user = await User.findOne({ email: req.body.email })
        if (!user) {
            result.message = "Email is not found"
            console.log(result.message)
            return res.status(400).send(result)
        }

        // Check password
        const validPass = await bcrypt.compare(req.body.password, user.password)
        if (!validPass) {
            result.message = "Email or password is wrong"
            console.log(result.message)
            return res.status(400).send(result)
        }
        //else console.log('success')
        // Create and assign a token
        
        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET)
        result.token = token
        result.message = "Success!"
      //  res.header("auth-token", token).send(result)

        console.log('login response: ' + result.message);
        if (result.token.length > 5) {
            //const str = JSON.stringify(result.token) 
            //console.log(result)
            req.session.userToken = result.token
            req.session.email = result.email
            res.redirect('/index')
            //res.render('index', { name: req.session.email });
           //res.header("auth-token", result.token).render('index', { name: req.session.userId });
        }

        else
            res.render('partials/loginnomatch')
    }
    catch (err) {
        console.log(err)
    }

})



router.post("/test", async (req, res) => {
  console.log("test");
  res.header("auth-test", "yoyo").send("test good");
})



// Gets back all users
router.get('/', verify, async (req, res) => {
    try{
       console.log('\n\nUserList requested')
        const users = await User.find()
        console.log(users)
        res.json(users)
    }catch(err) {
        res.json({message:err})
    }
})


//Get a specific user
router.get('/:userId', verify, async (req,res) => {
   
    try {
         //const loggedUser = await User.findbyOne({_id: req.user})
        //console.log(loggedUser)
        const user = await User.findById(req.params.userId)
        res.json(user)
    } 
    catch(err) {
        res.json({message: err})
    }

})
router.get('/userEmail/:email', verify, async (req,res) => {
   
    try {
        console.log('seeking: ' + req.params.email)
        const user = await User.findOne({ email: req.params.email } )
        console.log(user)
        //const t = await user.text()
        //console.log(t)
        res.send(user)
    } 
    catch(err) {
        res.json({message: err})
    }

})




//Delete a specific user
router.delete('/:userId', verify, async (req,res) => {
  console.log(req.params.userId)
    try {
        const ack = await User.deleteOne( {_id : req.params.userId } )
        res.json(ack)
    } 
    catch(err) {
        res.json({message: err})
    }
})

// Update a user
router.patch('/:userId', verify, async (req,res) => {
    try {
        const ack = await User.updateOne( {_id : req.params.userId }, {$set: {name: req.body.name, email: req.body.email, password: req.body.password } } )
        res.json(ack)
    } 
    catch(err) {
        res.json({message: err})
    }
})










router.get('/getUserList', redirectLogin, async (req, res) => {

    console.log('getting users list')

    let option = {
        method: 'GET',
        headers: {
            'auth-token': req.session.userToken
        }
    }

    let userlist

    try {
        const response = await fetch(apiUrl + "/api/user/", option)
        const data = await response.text()
        if (!data) {
            const message = "List not found...";
            return res.status(400).send(message);
        } else { userlist = JSON.parse(data) }

        console.log(userlist)
        res.json( userlist );
    }
    catch (err) {
        console.error(err)
    }

})



router.post('/deleteUser', redirectLogin, async (req, res) => {

    console.log('deleting : ' + req.body.email)

    let option = {
        method: 'GET',
        headers: {
            'auth-token': req.session.userToken
        }
    }

    let uid

    try {
        const response = await fetch(apiUrl + "/api/user/userEmail/" + req.body.email, option)
        //console.log(res1)
        const data = await response.text()
        if (!data) {
            const message = "Email is not found";
            return res.status(400).send(message);
        } else uid = JSON.parse(data)


        option.method = 'DELETE'
        const res2 = await fetch(apiUrl + '/api/user/' + uid._id, option)
        const confirm = await res2.text()
        console.log(confirm)
    }
    catch (err) {
        console.error(err)
    }

})

router.get('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.send('error destroying session')
        }
        console.log('logout & session destroy')
        res.clearCookie(process.env.SESS_NAME)
        res.redirect('/login')
    })
})








/*
async function loadList()
{
    
    const option = {
        method: 'POST',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({ name: process.env.API_USER, email: process.env.API_USER, password: process.env.API_PASS })  //  TODO: changer env pour avoir un user spécifique au serveur
    }

       const rawResponse = await fetch(apiUrl + '/api/user/login', option);
       const result = await rawResponse.json()

        console.log('login response: ' + result.message);
        if (result.token.length > 5) {
            const str = JSON.stringify(result.token)
            console.log(result)
            let tok = result.token

            
            let option = {
                method: 'GET',
                headers: {
                    'auth-token': tok
                }
            }

            const response = await fetch(apiUrl + "/api/heartbeat/devices") //, option)
            const data = await response.json()
            console.log('setting devices list')
            console.log(data)
            devices = data
        }

}
loadList()


*/


/*

const Datastore = require('nedb')
const picDb = new Datastore('pics.db');
picDb.loadDatabase();

router.get('/api', (request, response) => {
    picDb.find({}, (err, data) => {
        if (err) { response.end(); return; }
        response.json(data);
    });
});

router.post('/api', bodyParser.json(), (req, res) => {  //  TODO : je crois que bodyparser n'est plus requis... bug corrigé

    console.log('post to /api:')
    const data = req.body
    const timestamp = Date.now()
    data.timestamp = timestamp
    picDb.insert(data)
    res.json(data)

});

*/




module.exports = router;


