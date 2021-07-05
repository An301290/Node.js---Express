const connection = require("./db-config");
const express = require("express");
const app = express();
//Middleware that allowed us to ro read Json format request bodies
app.use(express.json());

const port = process.env.PORT || 3000;

connection.connect((err) => {
  if (err) {
    console.log(err);
    console.error("error connecting: " + err.stack);
  } else {
    console.log("connected as id " + connection.threadId);
  }
});

//creating the route movies and users

// app.get("/api/movies", (req, res) => {
//   connection.query("SELECT * FROM movies", (err, result) => {
//     if (err) {
//       res.status(500).send("Error retrieving data from database");
//     } else {
//       res.json(result);
//     }
//   });
// });

app.get("/api/movies", (req, res) => {
  let sql = "SELECT * FROM movies";
  const sqlValues = [];
  if (req.query.color) {
    sql += " WHERE color = ?";
    sqlValues.push(parseInt(req.query.color));
  }
  if (req.query.duration) {
    sql += " AND duration = ?";
    sqlValues.push(req.query.duration);
  }
  connection.query(sql, sqlValues, (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(result);
    }
  });
});

app.get("/api/users", (req, res) => {
  //--store the SQL query in a variable
  let sql = "SELECT * FROM users";
  //--- declare an empty array, which may contain values to pass to this query
  const sqlValues = [];
  //---We will add the condition containing the WHERE clause ---- the ? is going to be replace by the value
  if (req.query.language) {
    sql += " WHERE language = ?";
    sqlValues.push(req.query.language);
  }
  if (req.query.city) {
    sql += " And city = ?";
    sqlValues.push(req.query.city);
  }
  connection.query(sql, sqlValues, (err, result) => {
    if (err) {
      res.status(500).send("Error retrieving data from database");
    } else {
      res.json(result);
    }
  });
});

//-----Find a specific user

app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  connection.query(
    "SELECT * FROM users WHERE id = ?",
    [userId],
    (err, result) => {
      if (err) {
        res.status(500).send("Error retrieving data from database");
      } else {
        //-----res.json(result[0]) to send back a single user
        if (result.lenght) res.json(result[0]);
        else res.status(404).send("User not found");
      }
    }
  );
});

//How to insert data into your database

app.post("/api/movies", (req, res) => {
  const { title, director, year, color, duration } = req.body;
  //conection query allows us to insert or write query
  connection.query(
    //??? these values are going to be replace by real values
    "INSERT INTO MOVIES(title, director, year, color,duration)VALUES (?, ?, ?, ?, ?)",
    [title, director, year, color, duration],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error saving the movie");
      } else {
        const id = result.insertId;
        const createdUser = { id, firstname, lastname, email };
        res.status(201).json(createdUser);
      }
    }
  );
});

//Updating data from movies DB

app.put("/api/movies/:id", (req, res) => {
  const userId = req.params.id;
  connection.query(
    "SELECT * FROM movies WHERE id = ?",
    [userId],
    (err, selectResults) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error updating a user");
      } else {
        const userFromDb = selectResults[0];
        if (userFromDb) {
          const userPropsToUpdate = req.body;
          connection.query(
            "UPDATE movies SET ? WHERE id = ?",
            [userPropsToUpdate, userId],
            (err) => {
              if (err) {
                console.log(err);
                res.status(500).send("Error updating a user");
              } else {
                const updated = { ...userFromDb, ...userPropsToUpdate };
                res.status(200).json(updated);
              }
            }
          );
        } else {
          res.status(404).send(`User with id ${userId} not found.`);
        }
      }
    }
  );
});

// complete user object with all its attributes

app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  connection.query(
    "SELECT * FROM users WHERE id = ?",
    [userId],
    (err, selectResults) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error updating a user");
      } else {
        const userFromDb = selectResults[0];
        if (userFromDb) {
          const userPropsToUpdate = req.body;
          connection.query(
            "UPDATE users SET ? WHERE id = ?",
            [userPropsToUpdate, userId],
            (err) => {
              if (err) {
                console.log(err);
                res.status(500).send("Error updating a user");
              } else {
                const updated = { ...userFromDb, ...userPropsToUpdate };
                res.status(200).json(updated);
              }
            }
          );
        } else {
          res.status(404).send(`User with id ${userId} not found.`);
        }
      }
    }
  );
});

//-----------------Deleting data

app.delete("/api/movies/:id", (req, res) => {
  const userId = req.params.id;
  connection.query(
    "DELETE FROM movies WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("😱 Error deleting an user");
      } else {
        res.status(200).send("🎉 User deleted!");
      }
    }
  );
});

//------------------------------- Create Users

app.post("/api/users", (req, res) => {
  res.send("Post route is working with users 🎉");
});

app.post("/api/users", (req, res) => {
  const { First_name, Last_name, Email } = req.body;
  //conection query allows us to insert or write query
  connection.query(
    //??? these values are going to be replace by real values
    "INSERT INTO USERS (First_name, Last_name, Email)VALUES (?, ?, ?)",
    [First_name, Last_name, Email],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error saving the users");
      } else {
        //to return a newly created user from our route
        const id = result.insertId;

        const createdUser = { id, firstname, lastname, email };
        res.status(201).json(createdUser);
      }
    }
  );
});

//Post and Put in detail

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

//----- req.params & req.query
