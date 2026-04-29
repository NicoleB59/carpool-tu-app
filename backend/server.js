const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// Move this into .env in real projects
const uri =
  "mongodb+srv://b00157129_db_user:Bula1384cao@cluster0.hetflnn.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;

  // expects formats like "14:30"
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function getTimeDifferenceMinutes(requestedTime, rideTime) {
  const requested = parseTimeToMinutes(requestedTime);
  const ride = parseTimeToMinutes(rideTime);

  if (requested == null || ride == null) return 0;
  return Math.abs(requested - ride);
}

function normalize(value, maxValue) {
  if (maxValue <= 0) return 0;
  return Math.min(value / maxValue, 1);
}

function computeMatchScore({
  pickupDistanceKm,
  dropoffDistanceKm,
  timeDifferenceMin,
  detourDistanceKm,
  detourTimeMin,
}) {
  // Lower values = better
  const pickupScore = 1 - normalize(pickupDistanceKm, 5);       // ideal under 5 km
  const dropoffScore = 1 - normalize(dropoffDistanceKm, 5);     // ideal under 5 km
  const timeScore = 1 - normalize(timeDifferenceMin, 30);       // ideal under 30 min
  const detourDistanceScore = 1 - normalize(detourDistanceKm, 10); // ideal under 10 km
  const detourTimeScore = 1 - normalize(detourTimeMin, 20);     // ideal under 20 min

  const total =
    pickupScore * 0.25 +
    dropoffScore * 0.20 +
    timeScore * 0.20 +
    detourDistanceScore * 0.20 +
    detourTimeScore * 0.15;

  return Number((total * 100).toFixed(2));
}

function findNearestPointOnRoute(routePoints, targetLat, targetLng) {
  if (!Array.isArray(routePoints) || routePoints.length === 0) {
    return null;
  }

  let nearestIndex = -1;
  let nearestDistanceKm = Infinity;

  for (let i = 0; i < routePoints.length; i++) {
    const point = routePoints[i];
    const [lng, lat] = point.coordinates;

    const distanceKm = haversineKm(targetLat, targetLng, lat, lng);

    if (distanceKm < nearestDistanceKm) {
      nearestDistanceKm = distanceKm;
      nearestIndex = i;
    }
  }

  return {
    nearestIndex,
    nearestDistanceKm,
  };
}

function estimateRouteDistanceKmFromPoints(routePoints) {
  if (!Array.isArray(routePoints) || routePoints.length < 2) return 0;

  let totalKm = 0;

  for (let i = 1; i < routePoints.length; i++) {
    const [lng1, lat1] = routePoints[i - 1].coordinates;
    const [lng2, lat2] = routePoints[i].coordinates;

    totalKm += haversineKm(lat1, lng1, lat2, lng2);
  }

  return totalKm;
}

function estimateDetourFromRoute({
  routePoints,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  avgSpeedKmH = 35,
}) {
  if (!Array.isArray(routePoints) || routePoints.length < 2) {
    return {
      detourDistanceKm: 0,
      detourTimeMin: 0,
      pickupAccessKm: 0,
      dropoffAccessKm: 0,
    };
  }

  const pickupNearest = findNearestPointOnRoute(routePoints, pickupLat, pickupLng);
  const dropoffNearest = findNearestPointOnRoute(routePoints, dropoffLat, dropoffLng);

  if (!pickupNearest || !dropoffNearest) {
    return {
      detourDistanceKm: 0,
      detourTimeMin: 0,
      pickupAccessKm: 0,
      dropoffAccessKm: 0,
    };
  }

  // Simple approximation:
  // extra distance is passenger pickup getting off-route + passenger dropoff getting back to route
  const detourDistanceKm =
    pickupNearest.nearestDistanceKm + dropoffNearest.nearestDistanceKm;

  const detourTimeMin = (detourDistanceKm / avgSpeedKmH) * 60;

  return {
    detourDistanceKm: Number(detourDistanceKm.toFixed(2)),
    detourTimeMin: Number(detourTimeMin.toFixed(2)),
    pickupAccessKm: Number(pickupNearest.nearestDistanceKm.toFixed(2)),
    dropoffAccessKm: Number(dropoffNearest.nearestDistanceKm.toFixed(2)),
    pickupRouteIndex: pickupNearest.nearestIndex,
    dropoffRouteIndex: dropoffNearest.nearestIndex,
  };
}

async function run() {
  try {
    await client.connect();
    console.log(" Connected to MongoDB!");

    // Collections
    const db = client.db("app");
    const registeredUsersCollection = db.collection("register_users");
    const loginLogsCollection = db.collection("login_logs");
    const ridesCollection = db.collection("rides");
    const rideRequestsCollection = db.collection("ride_requests");
    const messagesCollection = db.collection("messages");
    const sustainabilityCollection = db.collection("sustainability");
    const reviewsCollection = db.collection("reviews");

    // Geo indexes
    await ridesCollection.dropIndex("routePoints_2dsphere").catch(() => {});
    await ridesCollection.dropIndex("routePoints.coordinates_2dsphere").catch(() => {});

    await ridesCollection.createIndex({ location: "2dsphere" });
    await ridesCollection.createIndex({ "routePoints.coordinates": "2dsphere" });

    // -------------------------
    // REGISTER
    // -------------------------
    app.post("/register", async (req, res) => {
      const { name, email, password, gender } = req.body;

      if (!name || !email || !password || !gender) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (!["female", "male", "other"].includes(gender)) {
        return res.status(400).json({ message: "Invalid gender selected" });
      }

      const validDomains = ["@tudublin.ie", "@mytudublin.ie"];
      const isValidEmail = validDomains.some((domain) =>
        email.toLowerCase().endsWith(domain)
      );
      if (!isValidEmail) {
        return res.status(400).json({ message: "Only TU Dublin emails are allowed" });
      }

      try {
        const existingUser = await registeredUsersCollection.findOne({ email });
        if (existingUser) {
          return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
          name,
          email,
          password: hashedPassword,
          gender,
          createdAt: new Date(),
        };

        const result = await registeredUsersCollection.insertOne(newUser);

        res.status(201).json({
          message: "User registered successfully",
          userId: result.insertedId,
        });
      } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error during registration" });
      }
    });

    // -------------------------
    // LOGIN
    // -------------------------
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      try {
        const user = await registeredUsersCollection.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        await loginLogsCollection.insertOne({
          userId: user._id,
          email: user.email,
          loginTime: new Date(),
        });

        res.status(200).json({
          message: "Login successful",
          user: { id: user._id, name: user.name, email: user.email, gender: user.gender },
        });
      } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
      }
    });

    // -------------------------
    // POST RIDE (DRIVER)
    // Now supports routePoints for matching pickup+dropoff along route
    // -------------------------
    app.post("/rides", async (req, res) => {
      const {
        start,
        destination,
        time,
        seats,
        driverEmail,
        driverGender,
        latitude,
        longitude,
        endLat,
        endLng,
        routePoints,
      } = req.body;

      if (!start || !destination || !time || !seats || !driverEmail) {
        return res.status(400).json({ message: "All ride fields are required" });
      }

      if (latitude == null || longitude == null) {
        return res.status(400).json({ message: "Driver start latitude/longitude required" });
      }

      // routePoints is strongly recommended for /rides/match
      const hasRoutePoints = Array.isArray(routePoints) && routePoints.length >= 2;

      try {
        const newRide = {
            start,
            destination,
            time,
            seats: parseInt(seats, 10),
            driverEmail,
            driverGender: driverGender || "unspecified",

          // Keep your existing field so /rides/search still works
          location: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)], // [lng, lat]
          },

          // Optional end point
          ...(endLat != null && endLng != null
            ? {
                endPoint: {
                  type: "Point",
                  coordinates: [parseFloat(endLng), parseFloat(endLat)],
                },
              }
            : {}),

          // NEW: for carpool matching
          ...(hasRoutePoints
            ? {
                routePoints: routePoints.map((p) => ({
                  type: "Point",
                  coordinates: [parseFloat(p.lng), parseFloat(p.lat)],
                })),
              }
            : {}),

          createdAt: new Date(),
        };

        const result = await ridesCollection.insertOne(newRide);

        console.log("Ride saved:", result.insertedId);

        res.status(201).json({
          message: hasRoutePoints
            ? "Ride posted successfully (route enabled)"
            : "Ride posted successfully (NO routePoints — match will be limited)",
          rideId: result.insertedId,
        });
      } catch (error) {
        console.error("Post Ride Error:", error);
        res.status(500).json({ message: "Failed to post ride" });
      }
    });

    // geocoding endpoint using OpenRouteService API
    app.get("/geocode", async (req, res) => {
      const { text } = req.query;

      if (!text) {
        return res.status(400).json({ message: "Destination text is required" });
      }

      try {
        const orsRes = await fetch(
          `https://api.openrouteservice.org/geocode/search?api_key=${process.env.ORS_API_KEY}&text=${encodeURIComponent(text)}`
        );

        const data = await orsRes.json();

        const feature = data?.features?.[0];
        if (!feature) {
          return res.status(404).json({ message: "Location not found" });
        }

        const [lng, lat] = feature.geometry.coordinates;

        res.json({
          lat,
          lng,
          label: feature.properties?.label || text,
        });
      } catch (error) {
        console.error("Geocode Error:", error);
        res.status(500).json({ message: "Failed to geocode destination" });
      }
    });

    // -------------------------
    // SIMPLE GEO SEARCH (PASSENGER)
    // Finds rides near driver's start point (location)
    // -------------------------
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
                coordinates: [parseFloat(lng), parseFloat(lat)],
              },
              $maxDistance: 10000, // 10km
            },
          },
        };

        if (destination) query.destination = { $regex: destination, $options: "i" };
        if (time) query.time = time;

        const rides = await ridesCollection.find(query).toArray();
        res.status(200).json(rides);
      } catch (error) {
        console.error("Geo Search Error:", error);
        res.status(500).json({ message: "Search failed" });
      }
    });

    // -------------------------
    // REAL CARPOOL MATCH (PASSENGER)
    // Finds rides whose route passes near BOTH pickup & dropoff
    // Requires rides.routePoints array + 2dsphere index on routePoints
    // -------------------------
    app.get("/rides/match", async (req, res) => {
      const {
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      time,
      preferredGender = "any",
      seatsNeeded = 1,
      maxDistanceM = 800,
      topN = 5,
      maxDetourKm = 8,
      maxDetourMin = 15,
    } = req.query;

      if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
        return res.status(400).json({ message: "pickup/dropoff coords required" });
      }

      const pickupLatNum = parseFloat(pickupLat);
      const pickupLngNum = parseFloat(pickupLng);
      const dropoffLatNum = parseFloat(dropoffLat);
      const dropoffLngNum = parseFloat(dropoffLng);
      const seatsNeededNum = parseInt(seatsNeeded, 10);

      const pickup = {
        type: "Point",
        coordinates: [pickupLngNum, pickupLatNum],
      };

      const dropoff = {
        type: "Point",
        coordinates: [dropoffLngNum, dropoffLatNum],
      };

      const maxD = parseInt(maxDistanceM, 10);
      const topNNum = parseInt(topN, 10);
      const maxDetourKmNum = parseFloat(maxDetourKm);
      const maxDetourMinNum = parseFloat(maxDetourMin);

      try {
        // 1) eligible rides: route passes near pickup
        const pickupMatches = await ridesCollection
          .aggregate([
            {
              $geoNear: {
                near: pickup,
                key: "routePoints.coordinates",                
                maxDistance: maxD,
                distanceField: "pickupDistanceMeters",
                spherical: true,
                query: time ? { time } : {},
              },
            },
            {
              $project: {
                _id: 1,
                pickupDistanceMeters: 1,
              },
            },
            { $limit: 500 },
          ])
          .toArray();

        const ids = pickupMatches.map((r) => r._id);

        if (ids.length === 0) {
          return res.json([]);
        }

        // among eligible rides: route also passes near dropoff
        const candidateRides = await ridesCollection
          .aggregate([
            {
              $geoNear: {
                near: dropoff,
                key: "routePoints.coordinates",
                maxDistance: maxD,
                distanceField: "dropoffDistanceMeters",
                spherical: true,
                query: { _id: { $in: ids } },
              },
            },
            {
              $project: {
                start: 1,
                destination: 1,
                time: 1,
                seats: 1,
                driverEmail: 1,
                driverGender: 1,
                location: 1,
                endPoint: 1,
                routePoints: 1,
                dropoffDistanceMeters: 1,
              },
            },
            { $limit: 100 },
          ])
          .toArray();

        const pickupDistanceMap = new Map();
        for (const match of pickupMatches) {
          pickupDistanceMap.set(match._id.toString(), match.pickupDistanceMeters);
        }

        const rankedResults = candidateRides
          .map((ride) => {
            const pickupDistanceMeters =
              pickupDistanceMap.get(ride._id.toString()) ?? 0;
            const dropoffDistanceMeters = ride.dropoffDistanceMeters ?? 0;

            const pickupDistanceKm = pickupDistanceMeters / 1000;
            const dropoffDistanceKm = dropoffDistanceMeters / 1000;

            const timeDifferenceMin = time
              ? getTimeDifferenceMinutes(time, ride.time)
              : 0;

            const detour = estimateDetourFromRoute({
              routePoints: ride.routePoints || [],
              pickupLat: pickupLatNum,
              pickupLng: pickupLngNum,
              dropoffLat: dropoffLatNum,
              dropoffLng: dropoffLngNum,
            });

            const baseRouteKm = estimateRouteDistanceKmFromPoints(ride.routePoints || []);
            const estimatedSharedRouteKm = Number(
              (baseRouteKm + detour.detourDistanceKm).toFixed(2)
            );

            const matchScore = computeMatchScore({
              pickupDistanceKm,
              dropoffDistanceKm,
              timeDifferenceMin,
              detourDistanceKm: detour.detourDistanceKm,
              detourTimeMin: detour.detourTimeMin,
            });

            return {
              _id: ride._id,
              start: ride.start,
              destination: ride.destination,
              time: ride.time,
              seats: ride.seats,
              driverEmail: ride.driverEmail,
              driverGender: ride.driverGender,

              pickupDistanceKm: Number(pickupDistanceKm.toFixed(2)),
              dropoffDistanceKm: Number(dropoffDistanceKm.toFixed(2)),
              timeDifferenceMin,

              estimatedBaseRouteKm: Number(baseRouteKm.toFixed(2)),
              estimatedDetourDistanceKm: detour.detourDistanceKm,
              estimatedDetourTimeMin: detour.detourTimeMin,
              estimatedSharedRouteKm,

              pickupAccessKm: detour.pickupAccessKm,
              dropoffAccessKm: detour.dropoffAccessKm,

              matchScore,
            };
          })
          .filter((ride) => {
            const detourOk =
              ride.estimatedDetourDistanceKm <= maxDetourKmNum &&
              ride.estimatedDetourTimeMin <= maxDetourMinNum;

            const seatsOk = (ride.seats || 0) >= seatsNeededNum;

            const genderOk =
              preferredGender === "any" ||
              !preferredGender ||
              ride.driverGender === preferredGender;

            return detourOk && seatsOk && genderOk;
          })
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, topNNum);

        res.status(200).json(rankedResults);
        } catch (error) {
          console.error("Match Error:", error);
          res.status(500).json({ message: "Match failed" });
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
          return res.status(409).json({ message: "You already requested this ride" });
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

    // -------------------------
    // DRIVER ACCEPT / REJECT REQUEST
    // -------------------------
    app.put("/rides/request/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      if (!["accepted", "rejected", "started", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      try {
        await rideRequestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        if (status === "completed") {
          const request = await rideRequestsCollection.findOne({
            _id: new ObjectId(id),
          });

          const ride = await ridesCollection.findOne({
            _id: new ObjectId(request.rideId),
          });

          const driverBaseKm = estimateRouteDistanceKmFromPoints(ride.routePoints || []);
          const sharedRouteKm = driverBaseKm;
          const passengerSoloKm = driverBaseKm;

          const sustainabilityRecord = {
            rideRequestId: id,
            rideId: request.rideId,
            passengerEmail: request.passengerEmail,
            driverEmail: ride.driverEmail,
            destination: ride.destination,
            driverBaseKm: Number(driverBaseKm.toFixed(2)),
            sharedRouteKm: Number(sharedRouteKm.toFixed(2)),
            passengerSoloKm: Number(passengerSoloKm.toFixed(2)),
            completedAt: new Date(),
          };

          await sustainabilityCollection.insertOne(sustainabilityRecord);
          console.log("Sustainability saved:", sustainabilityRecord);
        }

        res.status(200).json({ message: "Request updated" });
      } catch (error) {
        console.error("Update Request Error:", error);
        res.status(500).json({ message: "Failed to update request" });
      }
    });

    // -------------------------
    // GET ALL REQUESTS FOR A DRIVER
    // -------------------------
    app.get("/rides/requests/:driverEmail", async (req, res) => {
      const { driverEmail } = req.params;

      try {
        const driverRides = await ridesCollection.find({ driverEmail }).toArray();
        const rideIds = driverRides.map((ride) => ride._id.toString());

        const requests = await rideRequestsCollection
          .find({ rideId: { $in: rideIds } })
          .toArray();

        const requestsWithRideDetails = requests.map((request) => {
          const ride = driverRides.find((r) => r._id.toString() === request.rideId);

          return {
            ...request,
            driverEmail: ride?.driverEmail,
            destination: ride?.destination,
            start: ride?.start,
            time: ride?.time,
          };
        });

        res.status(200).json(requestsWithRideDetails);
      } catch (error) {
        console.error("Fetch Driver Requests Error:", error);
        res.status(500).json({ message: "Failed to fetch driver requests" });
      }
    });

    // GET ALL REQUESTS FOR A PASSENGER
    app.get("/rides/requests/passenger/:email", async (req, res) => {
      const { email } = req.params;

      try {
        const requests = await rideRequestsCollection
          .find({ passengerEmail: email })
          .toArray();

        const requestsWithRideDetails = await Promise.all(
          requests.map(async (request) => {
            const ride = await ridesCollection.findOne({
              _id: new ObjectId(request.rideId),
            });

            return {
              ...request,
              driverEmail: ride?.driverEmail || "Unknown driver",
              destination: ride?.destination || "Unknown destination",
              time: ride?.time || "Unknown time",
              start: ride?.start || "Unknown start",
            };
          })
        );

        res.status(200).json(requestsWithRideDetails);
      } catch (error) {
        console.error("Fetch Passenger Requests Error:", error);
        res.status(500).json({ message: "Failed to fetch passenger requests" });
      }
    });

    // SEND MESSAGE
    app.post("/messages", async (req, res) => {
      const { rideRequestId, senderEmail, message } = req.body;

      if (!rideRequestId || !senderEmail || !message) {
        return res.status(400).json({ message: "Missing message details" });
      }

      try {
        const newMessage = {
          rideRequestId,
          senderEmail,
          message,
          sentAt: new Date(),
        };

        await messagesCollection.insertOne(newMessage);
        res.status(201).json({ message: "Message sent" });
      } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    });

    // GET MESSAGES
    app.get("/messages/:rideRequestId", async (req, res) => {      
      const { rideRequestId } = req.params;
        try {
          const messages = await messagesCollection
            .find({ rideRequestId })
            .sort({ sentAt: 1 })
            .toArray();

          res.status(200).json(messages);
        } catch (error) {
          console.error("Fetch Messages Error:", error);
          res.status(500).json({ message: "Failed to fetch messages" });
        }
    });

    // GET SUSTAINABILITY RECORDS FOR A USER (DRIVER OR PASSENGER)
    app.get("/sustainability/:email", async (req, res) => {
    const { email } = req.params;

    try {
      const records = await sustainabilityCollection
        .find({
          $or: [
            { driverEmail: email },
            { passengerEmail: email },
          ],
        })
        .sort({ completedAt: -1 })
        .toArray();

      res.status(200).json(records);
    } catch (error) {
      console.error("Fetch Sustainability Error:", error);
      res.status(500).json({ message: "Failed to fetch sustainability data" });
    }
  });

    app.post("/reviews", async (req, res) => {
      const { reviewerEmail, rating, comment } = req.body;

      if (!reviewerEmail || !rating || !comment) {
        return res.status(400).json({ message: "Missing review details" });
      }

        try {
          const review = {
            reviewerEmail,
            rating,
            comment,
            createdAt: new Date(),
          };

          await reviewsCollection.insertOne(review);

          res.status(201).json({ message: "Review saved" });
        } catch (error) {
          console.error("Review Error:", error);
          res.status(500).json({ message: "Failed to save review" });
        }
    });

    const PORT = 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

run().catch(console.dir);

