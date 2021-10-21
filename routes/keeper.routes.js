



const mongo = require('mongodb').MongoClient;

const url = "mongodb://192.168.0.33:27017/IoT"

mongo.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database connected!");
  db.close();
});









app.get('/', (req, res) => {
  res.json({
    message: 'UGKeeper Database 💻 🖱️'
  });
});

app.get('/mews', (req, res, next) => {
  const mewsdb =  req.app.locals.meows
  mews
    .find()
    .then(mews => {
      res.json(mews);
    }).catch(next);
});

app.get('/v2/mews', (req, res, next) => {
  // let skip = Number(req.query.skip) || 0;
  // let limit = Number(req.query.limit) || 10;
  let { skip = 0, limit = 5, sort = 'desc' } = req.query;
  skip = parseInt(skip) || 0;
  limit = parseInt(limit) || 5;

  skip = skip < 0 ? 0 : skip;
  limit = Math.min(50, Math.max(1, limit));

  Promise.all([
    mews
      .count(),
    mews
      .find({}, {
        skip,
        limit,
        sort: {
          created: sort === 'desc' ? -1 : 1
        }
      })
  ])
    .then(([ total, mews ]) => {
      res.json({
        mews,
        meta: {
          total,
          skip,
          limit,
          has_more: total - (skip + limit) > 0,
        }
      });
    }).catch(next);
});

function isValidMew(mew) {
  return mew.name && mew.name.toString().trim() !== '' && mew.name.toString().trim().length <= 50 &&
    mew.content && mew.content.toString().trim() !== '' && mew.content.toString().trim().length <= 140;
}





const createMew = (req, res, next) => {
  if (isValidMew(req.body)) {
    const mew = {
      name: filter.clean(req.body.name.toString().trim()),
      content: filter.clean(req.body.content.toString().trim()),
      created: new Date()
    };

    mews
      .insert(mew)
      .then(createdMew => {
        res.json(createdMew);
      }).catch(next);
  } else {
    res.status(422);
    res.json({
      message: 'Hey! Name and Content are required! Name cannot be longer than 50 characters. Content cannot be longer than 140 characters.'
    });
  }
};

app.post('/mews', createMew);
app.post('/v2/mews', createMew);

app.use((error, req, res, next) => {
  res.status(500);
  res.json({
    message: error.message
  });
});
