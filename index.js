const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};
app.use(cors(corsConfig));
app.options("", cors(corsConfig));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wpjbnpk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server
    // await client.connect();

    const admissionCollection = client.db("college-booking").collection("admission");
    const collegeCollection = client.db("college-booking").collection("college");
    const subjectCollection = client.db("college-booking").collection("subject");
    const eventsCollection = client.db("college-booking").collection("events");
    const researchCollection = client.db("college-booking").collection("research");
    const reviewCollection = client.db("college-booking").collection("review");
    const sportsCollection = client.db("college-booking").collection("sports");
    const usersCollection = client.db("college-booking").collection("users");

    // verify JWT
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.send({ token });
    });

    // Warning: use verifyJWT before using verifyUser
    const verifyUser = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if (!existingUser) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    // ------------users related apis---------------------
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/isUser/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ result: true });
      } else {
        return res.send({ result: false });
      }
    });

    app.post("/addUser", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };

      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists!" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // delete user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });


    // ------------college related apis---------------------

    // add college
    app.post("/addcollege", async (req, res) => {
      const college = req.body;
      const result = await collegeCollection.insertOne(college);
      res.send(result);
    });

    // get all college info
    app.get("/college", async (req, res) => {
      const result = await collegeCollection.find().toArray();
      res.send(result);
    });

    // get college by id
    app.get("/collegeDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await collegeCollection.findOne(query);
      res.send(result);
    });
    // get subjects by college id
    app.get("/subjects/:id", async (req, res) => {
      const id = req.params.id;
      const query = { collegeId: new ObjectId(id) };
      const options = {
        projection: {
          collegeId: 1,
          subject: 1,
          college: 1,
        },
      };
      const result = await subjectCollection.find(query, options).toArray();
      res.send(result);
    });


    // get all research info
    app.get("/research", async (req, res) => {
      const result = await researchCollection.find().toArray();
      res.send(result);
    });

    // get research info by college id
    app.get("/research/:id", async (req, res) => {
      const id = req.params.id;
      const query = { collegeId: new ObjectId(id) };
      const options = {
        projection: {
          _id: 1,
          collegeId: 1,
          cite: 1,
        },
      };
      const result = await researchCollection.findOne(query, options);
      res.send(result);
    });


    // Apply for admission
    // add a new student
    app.post("/apply", async (req, res) => {
      const student = req.body;
      const result = await admissionCollection.insertOne(student);
      res.send(result);
    });

    // get all admission info
    app.get("/admission", async (req, res) => {
      const result = await admissionCollection.find().toArray();
      res.send(result);
    });


    // get my college info by email
    app.get("/mycollege/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await admissionCollection.find(query).toArray();
      res.send(result);
    });

    // get my college info by id
    app.get("/myEnrolledCollege/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await admissionCollection.findOne(query);
      res.send(result);
    });

    // del class by id
    app.delete("/deleteMyCollege/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await admissionCollection.deleteOne(query);
      res.send(result);
    });

    // update college feedback
    app.patch("/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedClass = req.body;
      const newValues = {
        $set: {
          review: updatedClass.review,
          rating: updatedClass.rating,
          
        },
      };
      const result = await admissionCollection.updateOne(filter, newValues);
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("College-booking is running...");
});

app.listen(port, () => {
  console.log(`College-booking is sitting on port ${port}`);
});
