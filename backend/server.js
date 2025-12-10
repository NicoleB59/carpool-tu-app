// const express = require('express');
// const cors = require('cors');
// const { MongoClient, ServerApiVersion } = require('mongodb');

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Replace <db_password> with your actual password
// const uri = "mongodb+srv://b00157129_db_user:Bula2cao*@cluster0.opaj543.mongodb.net/?appName=Cluster0";

// // Database client setup v2
// // mongodb+srv://b00157129_db_user:Bula2cao*@cluster0.opaj543.mongodb.net/?appName=Cluster0

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     await client.connect();
//     console.log("Connected to MongoDB!");

//     const db = client.db("app"); // your database name
//     const registeredUsersCollection = db.collection("register_users");

//     app.post('/register', async (req, res) => {
//       const newUser = req.body;

//       try {
//         const result = await registeredUsersCollection.insertOne(newUser);
//         res.status(201).send({ message: "User registered successfully", userId: result.insertedId });
//       } catch (error) {
//         console.error("Error inserting user:", error);
//       }
//   });

//     const PORT = 5000;
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//   } catch (err) {
//     console.error(err);
//   }
// }

// run().catch(console.dir);

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB URI (keep secret in real projects using .env)
const uri =
  "mongodb+srv://b00157129_db_user:Bula2cao*@cluster0.opaj543.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log(" Connected to MongoDB!");

    const db = client.db("app");
    const registeredUsersCollection = db.collection("register_users");

    // REGISTER ROUTE
    app.post("/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Basic Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }

      // Enforce TU Dublin email only
      if (!email.endsWith("@tudublin.ie")) {
        return res.status(400).json({
          message: "Only @tudublin.ie emails are allowed",
        });
      }

      try {
        // Prevent duplicate users
        const existingUser = await registeredUsersCollection.findOne({
          email,
        });

        if (existingUser) {
          return res.status(409).json({
            message: "User already exists",
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
          name,
          email,
          password: hashedPassword,
          createdAt: new Date(),
        };

        const result = await registeredUsersCollection.insertOne(newUser);

        res.status(201).json({
          message: "User registered successfully",
          userId: result.insertedId,
        });
      } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({
          message: "Server error during registration",
        });
      }
    });

    const PORT = 5000;
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

run().catch(console.dir);

