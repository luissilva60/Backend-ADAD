import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";
const router = express.Router();

// Devolve os primeiros 50 comentários da base de dados
router.get("/", async (req, res) => {
    let results = await db.collection('cinemas').find({})
        //.limit(50)
        .toArray();
    res.send(results).status(200);
});



export default router;