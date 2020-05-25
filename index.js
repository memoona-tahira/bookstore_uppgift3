const sqlite = require('sqlite-async');
const express = require('express');
const app = express();
app.use(express.json());
app.listen(3000, () => console.log('Listening on http://localhost:3000/api'));

app.use(function (error, req, res, next) {
  if (error) { res.json(error); }
  else { next(); }
});

const operators = [
  '>=',
  '!=',
  '<=',
  '>=',
  '=',
  '>',
  '<',
];

async function start() {
  let db = await sqlite.open('./database/bookstore.db');

  app.get('/api/*', async (req, res, next) => {
    if (!req.url.includes('?')) { next(); return; }
    let entity = req.url.split('/api/')[1].split('/')[0];
    let query = decodeURI(req.url.split('?')[1]).split('&');
    let q2 = [];
    let vals = [];
    let op;
    for (let a of query) {
      for (let o of operators) {
        if (a.includes(o)) {
          op = o;
          break;
        }
      }
      let [key, val] = a.split(op);
      q2.push(key + op + '?');
      vals.push(val);
    }
    q2 = q2.join(' AND ');
    let r;
    let q3 = `SELECT * FROM ${entity} WHERE ${q2}`;
    r = await db.all(q3, vals).catch(e => r = e);
    res.json(r);
  });

  app.get('/api/*/:id', async (req, res) => {
    let entity = req.url.split('/api/')[1].split('/')[0];
    let r;
    r = await db.all(`SELECT * FROM ${entity} WHERE id = ${req.params.id} `).catch(e => r = e);
    res.json(r);
  });

  app.get('/api/*', async (req, res) => {
    let entity = req.url.split('/api/')[1].split('/')[0];
    let r;
    r = await db.all(`SELECT * FROM ${entity} `).catch(e => r = e);
    res.json(r);
  });

  app.post('/api/*', async (req, res) => {
    let entity = req.url.split('/api/')[1].split('/')[0];
    let body = req.body;
    let a = Object.keys(body).join(', ');
    let b = Object.keys(body).map(x => '$' + x).join(', ');
    let $body = {};
    for (let key in body) {
      $body['$' + key] = body[key];
    }
    let q = `INSERT INTO ${entity} (${a}) VALUES(${b})`;
    r = await db.run(q, $body).catch(e => r = e);
    res.json(r);
  });

  app.put('/api/*/:id', async (req, res) => {
    let entity = req.url.split('/api/')[1].split('/')[0];
    let body = req.body;
    let i = []
    for (let key in body) {
      i.push(key + ' = $' + key);
    }
    i = 'SET ' + i.join(', ');
    let $body = {};
    for (let key in body) {
      $body['$' + key] = body[key];
    }
    $body.$id = +req.params.id;
    let q = `UPDATE ${entity} ` + i + ` WHERE id = $id`;
    let r;
    r = await db.run(q, $body).catch(e => r = e);
    res.json(r);
  });

  app.delete('/api/*/:id', async (req, res) => {
    let entity = req.url.split('/api/')[1].split('/')[0];
    let r = await db.run(`DELETE FROM ${entity} WHERE id = ${req.params.id} `);
    res.json(r);
  });

  app.all('*', (req, res) => {
    res.json({ error: 'No such route' });
  });

}

start();