const fs = require('fs');
const mysql = require('mysql');
const express = require('express');

const json = fs.readFileSync('../.db-auth/credentials.json', 'utf8');
const credentials = JSON.parse(json);

const service = express();

const connection = mysql.createConnection(credentials);
connection.connect(error => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
});

service.use(express.json());

// endpoints
service.get('/posts/:id', (request, response) => {
  const id = parseInt(request.params.id);

  const query = 'SELECT * FROM posts WHERE id = ? AND is_visible != 0';
  connection.query(query, id, (error, rows) => {
    if (error) {
      response.status(500);
      response.json({
        ok: false,
        results: error.message
      });
    } else {
      const post = rows.map(rowToMem);
      response.json({
        ok: true,
        results: rows.map(rowToMem)
      });
    }
  });
});

service.get('/posts', (request, response) => {
  const query = 'SELECT * FROM posts WHERE is_visible != 0 ORDER BY created_at DESC';

  connection.query(query, (error, rows) => {
    if (error) {
      response.status(500);
      response.json({
        ok: false,
        results: error.message
      });
    } else {
      const post = rows.map(rowToMem);
      response.json({
        ok: true,
        results: rows.map(rowToMem)
      });
    }
  });
});

service.post('/posts', (request, response) => {
  if (request.body.hasOwnProperty('content')) {
    const content = request.body.content;

    const query = 'INSERT INTO posts(content) VALUES(?)';
    connection.query(query, content, (error, result) => {
      if (error) {
        response.status(500);
        response.json({
          ok: false,
          results: error.message
        });
      } else {
        response.json({
          ok: true,
          results: result.insertId
        });
      }
    });
  } else {
    response.status(400);
    response.json({
      ok: false,
      results: 'Bad request'
    });
  }
});

const port = 5001;
service.listen(port, () => {
  console.log(`We're live on port ${port}!`);
});

function rowToMem(row) {
  return {
    id: row.id,
    parent_id: row.parent_id,
    content: row.content,
    likes: row.likes,
    comments: row.comments,
    is_visible: row.is_visible
  };
}