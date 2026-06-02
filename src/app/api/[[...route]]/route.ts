import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getPool } from '@/lib/db';
// import knexConfig from '@/lib/db';
// import knex from 'knex';

// const db = knex(knexConfig.development);


import { 
  alkalirecieved, 
  alkalimixed, 
  alkaliconsumed, 
  reportall,
  alkalitankmixed,
  alkalitankstore,
  reportnaohrecieved,
  reportnaohmixed,
  reportnaohconsumed
}  from '@/controller/alkaline.js';

import { 
  acidrecieved, 
  acidmixed, 
  acidconsumed,
  acidtankmixed,
  acidtankstore,
  reporthcirecieved,
  reporthcimixed,
  reporthciconsumed
   
}  from '@/controller/acid.js';

import {
  CardOverview, 
  chartFillOverview, 
  chartStoreOverview ,
  chartUsedOverview,
  reprotoverview
} from '@/controller/overview.js';
// import { a } from 'framer-motion/dist/types.d-DsEeKk6G';

// export const runtime = 'edge'

// const app = new Hono().basePath('/api')
const app = new Hono().basePath('/api')


// app.get('/hello', (c) => {

//   return c.json({
//     message: 'Hello, Smart Automation Thailand!'
//   })

// })

// app.get('/users', async (c) => {
//   const pool = await getPool();
//   const result = await pool.request().query('SELECT * FROM Users');
//   return c.json(result.recordset);
// });

// realtime
app.get('/wgcacak', async (c) => {
  const pool = await getPool();
  const result = await pool.request().query('SELECT TOP (1) * FROM realtime');
  // const result = await db.select('*').from('realtime');
  return c.json(result.recordset[0]);
});

app.get('/cardoverview', CardOverview);
app.get('/chartfilloverview', chartFillOverview); 
app.get('/chartstoreoverview', chartStoreOverview); 
app.get('/chartusedoverview', chartUsedOverview); 

// app.get('/metrics', async (c) => {
//   const pool = await getPool();
//   const result = await pool.request().query('SELECT COUNT(*) AS total FROM Orders');
//   return c.json(result.recordset[0]);
// });

// app.get('/tank1', )
// app.get ('/reportall', reportall);
// app.get ('/reportnaohrecieved', reportnaohrecieved);

app.get('/alkalirecieved', alkalirecieved);
app.get('/alkalimixed', alkalimixed);
app.get('/alkaliconsumed', alkaliconsumed);
app.get('/alkalitankmixed', alkalitankmixed);
app.get('/alkalitankstore', alkalitankstore);

app.get('/acidrecieved', acidrecieved);
app.get('/acidmixed', acidmixed);
app.get('/acidconsumed', acidconsumed);
app.get('/acidtankmixed', acidtankmixed);
app.get('/acidtankstore', acidtankstore);

app.get('/reportoverview', reprotoverview);


app.get('/reportnaohrecieved', reportnaohrecieved);
app.get('/reportnaohmixed', reportnaohmixed);
app.get('/reportnaohused', reportnaohconsumed);

app.get('/reporthcirecieved', reporthcirecieved);
app.get('/reporthcimixed', reporthcimixed);
app.get('/reporthciused', reporthciconsumed);



// app.get('/alkalirecieved', async (c) => {

//   return c.json({
//     message: 'Hello, Smart Automation Thailand!'
//   });
// });

//   const pool = await getPool();
//   const result = await pool.request()
//   .query('SELECT * FROM alkalirecieved');
//   return c.json(result.recordset);

// });

export const GET = handle(app)
