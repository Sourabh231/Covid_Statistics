const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const cors = require('cors');
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector');

app.use(cors());

app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Headers',
  'Origin, X-Requested-with, Content-Type,Accept'
  );
  next();
})

app.get('/totalRecovered',async(req,res)=>{
    const resp = await connection.aggregate([
        {
            $group:{
                _id:'total',
                recovered:{$sum:`$recovered`}
            },
        },
    ]);
    res.json({data:resp[0]});
});

app.get('/totalActive', async (req, res) => {
    const response = await connection.aggregate([
      {
        $group: {
          _id: 'total',
          active: {
            $sum: {
              $subtract: ['$infected','$recovered'],
            },
          },
        },
      },
    ]);
    res.json({ data: response[0] });
  });

app.get('/totalDeath',async(req,res)=>{
    const resp = await connection.aggregate([
        {
            $group:{
                _id:'total',
                death:{$sum:`$death`}
            },
        },
    ]);
    res.json({data:resp[0]});
});


app.get('/hotspotStates',async(req,res)=>{
    const resp = await connection.aggregate([
        {
          $project: {
            state: 1,
            rate: {
              $round: [
                {
                  $divide: [
                    { $subtract: ['$infected', '$recovered'] },
                    '$infected',
                  ],
                },
                5,
              ],
            },
          },
        },
        {
          $match: {
            rate: { $gt: 0.1 },
          },
        },
      ]);
    res.json({data:resp});
});

app.get('/healthyStates',async(req,res)=>{
    //  const resp = await connection.aggregate([
    //     {
    //         $project: {
    //           id:'$state',
    //           mortality: {
    //             $round: [
    //               {
    //                 $divide:[`$death`,'$infected']
    //               },
    //               5,
    //             ],
    //           },
    //         },
    //       },
    //       {
    //         $match: {
    //           mortality: { $lt: 0.005 },
    //         },
    //       },
    //       {$project:{
    //          _id:'$_id',
    //          state:'$_id',
    //          mortality:1
    //       }
    //     }
    //  ]);
    const resp = await connection.aggregate([
        {
          $project: {
            state: 1,
            mortality: {
              $round: [{ $divide: ['$death', '$infected'] }, 5],
            },
          },
        },
        {
          $match: {
            mortality: { $lt: 0.005 },
          },
        },
      ]);

     res.json({data:resp});
})


app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;