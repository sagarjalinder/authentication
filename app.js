const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (err) {
    console.log(`Db Error ${err.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//Rigister API-1

app.post("/rigister", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `
        SELECT
          *  
        FROM 
          user
        WHERE
          username = '${username}'
    `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (request.body.password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO 
              user (username, name, password, gender, location) 
            VALUES 
              (
                '${username}', 
                '${name}',
                '${hashedPassword}', 
                '${gender}',
                '${location}'
              )`;
      await db.run(createUserQuery);
      response.status(200);
      response.send("Successful registration of the registrant");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login API-2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
        SELECT
          *  
        FROM 
          user
        WHERE
          username = '${username}'
    `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.send(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send(200);
      response.send("Login success!");
    } else {
      response.send(400);
      response.send("Invalid password");
    }
  }
});

//Update Password API-3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.newPassword, 10);
  const selectUserQuery = `
        SELECT
          *  
        FROM 
          user
        WHERE
          username = '${username}'
    `;
  const dbUser = await db.get(selectUserQuery);
  const isCurrentPasswordMatched = await bcrypt.compare(
    oldPassword,
    dbUser.password
  );
  if (isCurrentPasswordMatched === true) {
    if (request.body.newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `
            UPDATE user
            SET
              password = '${hashedPassword}'
            WHERE
              username = '${username}'
          `;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
