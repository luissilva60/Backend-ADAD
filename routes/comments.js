import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";
const router = express.Router();

// Devolve os primeiros 50 comentários da base de dados 
router.get("/", async (req, res) => {
    let results = await db.collection('comments').find({})
        //.limit(50)
        .toArray();
    res.send(results).status(200);
});

// Adiciona comentários à base de dados #20
router.post("/", async (req, res) => {
    try {
        const comment = req.body;

        // Insert the new movie document into the "movies" collection
        const result = await db.collection('comments').insertOne(comment);
        res.send(result)
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

// Apaga um comentário da base de dados por id #22
router.delete('/:id', async (req, res) => {
    let commentId;

    if (req.params.id.length === 24) {
        commentId = new ObjectId(req.params.id);
    } else {
        commentId = parseInt(req.params.id);
    }

    try {
        let comment = await db.collection('comments').deleteOne({ _id: commentId });

        if (comment) {
            res.status(200).json(comment);
        } else {
            res.status(404).json({ error: "Comment not found" });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal Server Error" });
    }
});


export default router;