let router = require('express').Router()
//const mdb = require('../mongo')

router.get('/', (req, res) => {
    res.json({
        message: 'UGKeeper Database 💻 🖱️ 🦾'
    })
})
  



let selectedCollection 

router.get('/list', async (req, res, next) => {
    // let skip = Number(req.query.skip) || 0
    // let limit = Number(req.query.limit) || 10
    let { skip = 0, limit = 5, sort = 'desc' , collection = selectedCollection} = req.query  //  http://192.168.0.33:3001/server/list?skip=0&limit=25&sort=desc&collection=users
    skip = parseInt(skip) || 0
    limit = parseInt(limit) || 5

    skip = skip < 0 ? 0 : skip;
    limit = Math.min(50, Math.max(1, limit))

    if(collection == "")   collection = selectedCollection
    else  selectedCollection = collection

    console.log("WANTED", req.query, collection)
 
    const db =  req.app.locals.collections[collection]
    //console.log(db)
//  TODO  :  crash si le nom de la collection n'Existe pas dans la BD, ou si il n'y a pas de post dans la collection.
    if(!db) res.json({})
    else {     

        Promise.all([
            db.countDocuments(),
            db.find({}, {
                skip,
                limit,
                sort: {  created: sort === 'desc' ? -1 : 1     }
            }).toArray()
        ])
        .then(([ total, data ]) => {
            res.json({
            data,
            meta: {
                total,
                skip,
                limit,
                has_more: total - (skip + limit) > 0,
            }
            })
        }).catch(next)  

    }
})


// Export API routes
module.exports = router