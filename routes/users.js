import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import verifyJwt from "../utils/JWT/jwt.js";
import encryption from "../utils/encryption/encryption.js";

const router = express.Router();
// Devolve os primeiros 50 utilizadores da base de dados
router.get("/", async (req, res) => {
    let results = await db.collection("movielens_users").find({}).limit(100).toArray();
    res.send(results).status(200);
});

// Adiciona utilizadores à base de dados
router.post("/", async (req, res) => {
    try {
        const user = req.body;

        // Insert the new user into the "users" collection
        const result = await db.collection("movielens_users").insertMany(user);
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
    }
});

// Pesquisa o utilizador por id
router.get("/:id", async (req, res) => { 
    let userId;

    if (req.params.id.length === 24) {
        userId = new ObjectId(req.params.id);
    } else {
        userId = parseInt(req.params.id);
    }

    try {
        const user = await db.collection("movielens_users").aggregate([
            { $match: { _id: userId } },
            { $unwind: "$movies" },
            { $sort: { "movies.rating": -1 } },
            { $limit: 5 },
            { $group: { _id: "$_id", name: { $first: "$name" }, gender: { $first: "$gender" }, email: { $first: "$email" }, password: { $first: "$password" }, age: { $first: "$age" }, occupation: { $first: "$occupation" }, movies: { $push: "$movies" } } }
        ]).toArray();

        if (user.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Apaga um utilizador por id 
router.delete("/:id", verifyJwt, async (req, res) => {
    let userId;

    if (req.params.id.length === 24) {
        userId = new ObjectId(req.params.id);
    } else {
        userId = parseInt(req.params.id);
    }
    
    console.log(userId);
    try {
        let user = await db.collection("movielens_users").deleteOne({ _id: userId });

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});






router.post('/login', async (req, res) => {
    try {
        // Get user from database
        const user = await db.collection('movielens_users').findOne({ email: req.body.email });

        if (user && user.password) {
            console.log("Encrypted Password from Database:", user.password);

            const decryptedPassword = encryption.decrypt(user.password.toString());

            console.log("Decrypted Password:", decryptedPassword);

            // Check if the decrypted password matches the one provided in the request
            if (req.body.password === decryptedPassword) {
                // User found, generate JWT token
                const token = jwt.sign({ sessionKey: user._id }, "wcGBBhaRBJnuWRw", { expiresIn: '3600s' });

                // Send token in the response
                res.status(200).json({ user, token });
            } else {
                // Password is incorrect
                res.status(401).json({ message: 'Invalid email or password.' });
            }
        } else {
            // User doesn't exist or password is missing
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});


router.put("/updatePasswords", verifyJwt, async (req, res) => {
    try {

        const users = await db.collection('movielens_users').find().toArray();


        for (let user of users) {

            if (user.password) {

                const hashedPassword = encryption.encrypt(user.password)

                await db.collection('movielens_users').updateOne(
                    { _id: user._id },
                    { $set: { password: hashedPassword } }
                );
            }
        }

        res.status(200).json({ message: "All user passwords updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

router.put("/updatePassword/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if the provided userId is a valid ObjectId


        // Find the user by ID
        const user = await db.collection('movielens_users').findOne({ _id: parseInt(userId) });

        if (user && user.password) {
            try {

                const hashedPassword = encryption.encrypt(user.password)

                // Update the hashed password in the database
                await db.collection('movielens_users').updateOne(
                    { _id: parseInt(userId) },
                    { $set: { password: hashedPassword } }
                );

                res.status(200).json({ message: `Password updated successfully for user with ID ${userId}` });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        } else {
            // User not found or password not set
            res.status(404).json({ message: 'User not found or password not set.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Atualiza informações de um utilizador por id
router.put("/:id", verifyJwt, async (req, res) => {
    let userId;

    if (req.params.id.length === 24) {
        userId = new ObjectId(req.params.id);
    } else {
        userId = parseInt(req.params.id);
    }
    console.log(req.body)
    const { name, gender, age, occupation, movies, email, password } = req.body;

    try {
        const user = await db.collection("movielens_users").updateOne(
            { _id: userId },
            { $set: { name, gender, age, occupation, movies, email, password } }
        );

        if (user.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
export default router;


