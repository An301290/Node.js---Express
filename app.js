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

app.get("/api/movies/:id", (req, res) => {
  const movieId = req.params.id;
  connection.query(
    "SELECT * FROM movies WHERE id = ?",
    [movieId],
    (err, results) => {
      if (err) {
        res.status(500).send("Error retrieving movie from database");
      } else {
        if (results.length) res.json(results[0]);
        else res.status(404).send("Movie not found");
      }
    }
  );
});

//How to insert data into your database

// app.post("/api/movies", (req, res) => {
//   const { title, director, year, color, duration } = req.body;
//   //conection query allows us to insert or write query
//   connection.query(
//     //??? these values are going to be replace by real values
//     "INSERT INTO MOVIES(title, director, year, color,duration)VALUES (?, ?, ?, ?, ?)",
//     [title, director, year, color, duration],
//     (err, result) => {
//       if (err) {
//         console.error(err);
//         res.status(500).send("Error saving the movie");
//       } else {
//         const id = result.insertId;
//         const createdUser = { id, firstname, lastname, email };
//         res.status(201).json(createdUser);
//       }
//     }
//   );
// });

app.post("/api/users", (req, res) => {
  // Checking if all required fields are filled in and if email has right format and is now duplicate
  const { firstname, lastname, email, city, language } = req.body;
  const db = connection.promise();
  let validationErrors = null;

  db.query("SELECT * FROM users WHERE email = ?", [email])
    .then(([result]) => {
      if (result[0]) return Promise.reject("DUPLICATE_EMAIL");
      validationErrors = Joi.object({
        email: Joi.string().email().max(255).required(),
        firstname: Joi.string().max(255).required(),
        lastname: Joi.string().max(255).required(),
        city: Joi.string().max(255),
        language: Joi.string().max(255),
      }).validate(
        { firstname, lastname, email, city, language },
        { abortEarly: false }
      ).error;
      if (validationErrors) return Promise.reject("INVALID_DATA");
      return db.query(
        "INSERT INTO users (firstname, lastname, email) VALUES (?, ?, ?)",
        [firstname, lastname, email]
      );
    })
    .then(([{ insertId }]) => {
      res.status(201).json({ id: insertId, firstname, lastname, email });
    })
    .catch((err) => {
      console.error(err);
      if (err === "DUPLICATE_EMAIL")
        res.status(409).json({ message: "This email is already used" });
      else if (err === "INVALID_DATA")
        res.status(422).json({ validationErrors });
      else res.status(500).send("Error saving the user");
    });
});

// This route will update a user in the DB
app.put("/api/users/:id", (req, res) => {
  const { firstname, lastname, email, city, language } = req.body;
  const userId = req.params.id;
  const db = connection.promise();
  let existingUser = null;
  let validationErrors = null;
  db.query("SELECT * FROM users WHERE id = ?", [userId])
    .then(([results]) => {
      existingUser = results[0];
      if (!existingUser) return Promise.reject("RECORD_NOT_FOUND");
      validationErrors = Joi.object({
        email: Joi.string().email().max(255),
        firstname: Joi.string().max(255),
        lastname: Joi.string().max(255),
        city: Joi.string().max(255),
        language: Joi.string().max(255),
      }).validate(
        { firstname, lastname, email, city, language },
        { abortEarly: false }
      ).error;
      if (validationErrors) return Promise.reject("INVALID_DATA");
      return db.query("UPDATE users SET ? WHERE id = ?", [req.body, userId]);
    })
    .then(() => {
      res.status(200).json({ ...existingUser, ...req.body });
    })
    .catch((err) => {
      console.error(err);
      if (err === "RECORD_NOT_FOUND")
        res.status(404).send(`User with id ${userId} not found.`);
      else if (err === "INVALID_DATA")
        res.status(422).json({ validationErrors });
      else res.status(500).send("Error updating a user");
    });
});

// This route will update a movie in the DB
app.put("/api/movies/:id", (req, res) => {
  const movieId = req.params.id;
  const { title, director, year, color, duration } = req.body;
  const db = connection.promise();
  let existingMovie = null;
  const { error } = Joi.object({
    title: Joi.string().max(255),
    director: Joi.string().max(255),
    year: Joi.number().integer().greater(1887),
    color: Joi.boolean().truthy(1).falsy(0),
    duration: Joi.number().integer().positive(),
  }).validate(
    { title, director, year, color, duration },
    { abortEarly: false }
  );

  if (error) {
    res.status(422).json({ validationErrors: error.details });
  } else {
    db.query("SELECT * FROM movies WHERE id = ?", [movieId])
      .then(([results]) => {
        existingMovie = results[0];
        if (!existingMovie) return Promise.reject("RECORD_NOT_FOUND");
        return db.query("UPDATE movies SET ? WHERE id = ?", [
          req.body,
          movieId,
        ]);
      })
      .then(() => {
        res.status(200).json({ ...existingMovie, ...req.body });
      })
      .catch((err) => {
        console.error(err);
        if (err === "RECORD_NOT_FOUND")
          res.status(404).send(`Movie with id ${movieId} not found.`);
        else res.status(500).send("Error updating a movie");
      });
  }
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
  const { firstname, lastname, email, city, language } = req.body;
  //conection query allows us to insert or write query
  connection.query(
    //??? these values are going to be replace by real values
    "INSERT INTO USERS (First_name, Last_name, Email, City, Language)VALUES (?, ?, ?,?,?)",
    [firstname, lastname, email, city, language],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error saving the users");
      } else {
        //to return a newly created user from our route
        const id = result.insertId;

        const createdUser = { id, firstname, lastname, email, city, language };
        res.status(201).json(createdUser);
      }
    }
  );
});

//Validate user input
//Return appropriate responses in case of error

//Post and Put in detail

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

//----- req.params & req.query
