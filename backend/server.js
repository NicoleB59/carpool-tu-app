const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB URI (keep secret in real projects using .env)
const uri ="mongodb+srv://b00157129_db_user:Bula2cao*@cluster0.opaj543.mongodb.net/?appName=Cluster0";

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
    const loginLogsCollection = db.collection("login_logs");
    const ridesCollection = db.collection("rides");
    const rideRequestsCollection = db.collection("ride_requests");

    // Create geospatial index on rides collection
    await ridesCollection.createIndex({ location: "2dsphere" });

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
      const validDomains = ["@tudublin.ie", "@mytudublin.ie"];

      const isValidEmail = validDomains.some((domain) =>
        email.toLowerCase().endsWith(domain)
      );

      if (!isValidEmail) {
        return res.status(400).json({
          message: "Only TU Dublin emails are allowed",
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

    // LOGIN ROUTE
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      try {
        const user = await registeredUsersCollection.findOne({ email });

        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        // SAVE LOGIN ACTIVITY (SAFE)
        await loginLogsCollection.insertOne({
          userId: user._id,
          email: user.email,
          loginTime: new Date(),
        });

        res.status(200).json({
          message: "Login successful",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        });
      } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
      }
    });

    // POST RIDE (DRIVER)
    app.post("/rides", async (req, res) => {
      const {
        start,
        destination,
        time,
        seats,
        driverEmail,
        latitude,
        longitude,
      } = req.body;

      if (
        !start ||
        !destination ||
        !time ||
        !seats ||
        !driverEmail ||
        latitude == null ||
        longitude == null
      ) {
        return res.status(400).json({
          message: "All ride fields and coordinates are required",
        });
      }

      try {
        const newRide = {
          start,
          destination,
          time,
          seats,
          driverEmail,
          location: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)], // [lng, lat]
          },
          createdAt: new Date(),
        };

        const result = await ridesCollection.insertOne(newRide);

        res.status(201).json({
          message: "Ride posted successfully",
          rideId: result.insertedId,
        });
      } catch (error) {
        console.error("Post Ride Error:", error);
        res.status(500).json({
          message: "Failed to post ride",
        });
      }
    });


    // GEO SEARCH FOR RIDES (PASSENGER)
    app.get("/rides/search", async (req, res) => {
      const { lat, lng, destination, time } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }

      try {
        const query = {
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)], // [lng, lat]
              },
              $maxDistance: 10000, // 10 km radius (tune this)
            },
          },
        };

        if (destination) {
          query.destination = { $regex: destination, $options: "i" };
        }

        if (time) {
          query.time = time;
        }

        const rides = await ridesCollection.find(query).toArray();

        res.status(200).json(rides);
      } catch (error) {
        console.error("Geo Search Error:", error);
        res.status(500).json({ message: "Search failed" });
      }
    });

    // PASSENGER REQUESTS A RIDE
    app.post("/rides/request", async (req, res) => {
    const { rideId, passengerEmail } = req.body;

    if (!rideId || !passengerEmail) {
      return res.status(400).json({ message: "Missing request data" });
    }

    try {
      const existing = await rideRequestsCollection.findOne({
        rideId,
        passengerEmail,
      });

      if (existing) {
        return res.status(409).json({
          message: "You already requested this ride",
        });
      }

      const newRequest = {
        rideId,
        passengerEmail,
        status: "pending",
        requestedAt: new Date(),
      };

      await rideRequestsCollection.insertOne(newRequest);

        res.status(201).json({ message: "Ride request sent" });
      } catch (error) {
        console.error("Request Ride Error:", error);
        res.status(500).json({ message: "Failed to send request" });
      }
    });

    // DRIVER ACCEPT / REJECT REQUEST
    app.put("/rides/request/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body; // "accepted" or "rejected"

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      try {
        await rideRequestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        res.status(200).json({ message: "Request updated" });
      } catch (error) {
        console.error("Update Request Error:", error);
        res.status(500).json({ message: "Failed to update request" });
      }
    });

    // GET ALL REQUESTS FOR A DRIVER
    app.get("/rides/requests/:driverEmail", async (req, res) => {
      const { driverEmail } = req.params;

      try {
        const driverRides = await ridesCollection
          .find({ driverEmail })
          .toArray();

        const rideIds = driverRides.map((ride) => ride._id.toString());

        const requests = await rideRequestsCollection
          .find({ rideId: { $in: rideIds } })
          .toArray();

        res.status(200).json(requests);
      } catch (error) {
        console.error("Fetch Driver Requests Error:", error);
        res.status(500).json({ message: "Failed to fetch driver requests" });
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

