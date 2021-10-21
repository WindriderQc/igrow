let router = require('express').Router()
//const mdb = require('../mongo')

router.get('/', (req, res) => {
    res.json({
        message: 'UGKeeper Database 💻 🖱️ 🦾'
    })
})
  

router.get('/list', async (req, res, next) => {
    // let skip = Number(req.query.skip) || 0
    // let limit = Number(req.query.limit) || 10
    let { skip = 0, limit = 5, sort = 'desc' , collection = 'alarms'} = req.query
    skip = parseInt(skip) || 0
    limit = parseInt(limit) || 5

    skip = skip < 0 ? 0 : skip;
    limit = Math.min(50, Math.max(1, limit))

    const db =  req.app.locals.collections[collection]
   // console.log(db)
   //  TODO  :  crash si le nom de la collection n'Existe pas dans la BD
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



})


// Export API routes
module.exports = router