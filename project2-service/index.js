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

  doesExist(id, function(result) {
    if (result > 0) {
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
    } else if (result == 0) {
      response.status(404);
      response.json({
        ok: false,
        results: "Post does not Exist"
      });
    } else {
      response.status(500);
      response.json({
        ok: false,
        results: "Database Error"
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

service.post('/comment/:id', (request, response) => {
  if (request.body.hasOwnProperty('content')) {
    const params = [
      parseInt(request.params.id),
      request.body.content
    ];

    doesExist(params[0], function(result) {
      if (result > 0) {
        const query = 'INSERT INTO posts(parent_id, content) VALUES(?, ?)';
        connection.query(query, params, (error, result) => {
          if (error) {
            response.status(500);
            response.json({
              ok: false,
              results: error.message
            });
          } else {
	    const insertId = result.insertId
            const query2 = 'UPDATE posts SET comments = comments + 1 WHERE id = ?';
            connection.query(query2, params[0], (error, result) => {
              if (error) {
                response.status(500);
                response.json({
                  ok: false,
                  results: error.message
                });
              } else {
                response.json({
                  ok: true,
                  results: insertId
                });
              }
            });
          }
        });
      } else if (result == 0) {
        response.status(404);
        response.json({
          ok: false,
          results: "Post does not exist"
        });
      } else {
	      response.status(500);
	      response.json({
	        ok: false,
	        results: "Database error"
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

service.patch('/like/:id', (request, response) => {
  const id = parseInt(request.params.id);

  doesExist(id, function(result) {
    if (result > 0) {
      const query = 'UPDATE posts SET likes = likes + 1 WHERE id = ?';
      connection.query(query, id, (error, result) => {
        if (error) {
          response.status(500);
          response.json({
            ok: false,
            results: error.message
          });
        } else {
          response.json({
            ok: true
          });
        }
      });
    } else if (result == 0) {
      response.status(404);
      response.json({
        ok: false,
        results: "Post does not exist"
      });
    } else {
      response.status(400);
      response.json({
        ok: false,
        results: "Database error"
       });
    }
  });
});

service.delete('/posts/:id', (request, response) => {
  const id = parseInt(request.params.id);

  doesExist(id, function(result) {
    if (result > 0) {
      const query = "UPDATE posts SET is_visible = 0 WHERE id = ?";

      connection.query(query, id, (error, result) => {
        if (error) {
          response.status(500);
          response.json({
            ok: false,
            results: error.message
          });
        } else {
          response.json({
            ok: true
          });
        }
      });
    } else if (result == 0) {
      response.status(404);
      response.json({
        ok: false,
        results: "Post does not exist"
      });
    } else {
      response.status(500);
      response.json({
        ok: false,
        results: "Database error"
      });
    }
  });
});

const port = 5001;
service.listen(port, () => {
  console.log(`We're live on port ${port}!`);
});

/** 
 * Checks if post with given id exists.
 * 
*/
function doesExist(id, callback) {
  const query = 'SELECT * FROM posts WHERE id = ?';
  connection.query(query, id, (error, result) => {
    if (error) {
      return callback(-1);
    } else {
      if (result && result.length) {
	console.log(result)
     	  return callback(result[0].id);
      } else {
	      return callback(0);
      }
    }
  });
}

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
