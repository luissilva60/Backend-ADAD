import express from "express";
import db from "../db/config.js";

import {ObjectId} from "mongodb"; // Import ObjectId from the MongoDB library

const router = express.Router();
router.get("/", async (req, res) => {
    try {
        // Use aggregation to calculate the average score and find all comments for each movie
        const moviesWithDetails = await db.collection('movielens_users').aggregate([
            { $unwind: '$movies' },
            { $group: { _id: '$movies.movieid', avgScore: { $avg: '$movies.rating' }}},
            { $lookup: { from: "movielens_movies", localField: "_id", foreignField: "_id", as: "movie"}},
            { $unwind: "$movie"},
            { $lookup: { from: "comments", localField: "_id", foreignField: "movie_id", as: "comments" }},
            { $addFields: { "movie.avgScore": "$avgScore", "movie.comments": "$comments"}},
            {$replaceRoot: { newRoot: "$movie" }}
        ]).toArray();

        // Send the response
        res.status(200).json(moviesWithDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.post("/", async(req, res) => {
    const movies = req.body;
    await db.collection('movielens_movies')
        .insertMany(movies)
        .then(result => {
            res.status(201).json(result)
        })
        .catch(err =>{
            res.status(500).json({err: err})
        })
});













router.delete('/:id', async (req, res) => {
    var movieId = parseInt(req.params.id)

    try {
        let movie = await db.collection('movielens_movies').deleteOne({_id: movieId});

        if (movie) {
            res.status(200).json(movie);
        } else {
            res.status(404).json({error: "Movie not found"});
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal Server Error"});
    }
});








router.put("/:id", async (req, res) => {
    let movieId;

    if (req.params.id.length === 24) {
        movieId = new ObjectId(req.params.id);
    } else {
        movieId = parseInt(req.params.id);
    }

    const { title, genres } = req.body;

    try {
        const movie = await db.collection("movielens_movies").updateOne(
            { _id: movieId },
            { $set: { title, genres } }
        );

        if (movie.matchedCount === 0) {
            return res.status(404).json({ error: "Movie not found" });
        }

        res.status(200).json({ message: "Movie updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/higher/:num_movies", async (req, res) => {
    try {
        const num_movies = parseInt(req.params.num_movies);

        // Use aggregation to calculate the average score for each movie
        const result = await db.collection('movielens_users').aggregate([
            { $unwind: '$movies' },
            { $group: { _id: '$movies.movieid', avgScore: { $avg: '$movies.rating' }}},
            { $lookup: { from: "movielens_movies", localField: "_id", foreignField: "_id", as: "movie"}},
            { $unwind: "$movie"},
            { $addFields: { "movie.avgScore": "$avgScore"}},
            { $replaceRoot: { newRoot: "$movie" }},
            { $sort: { avgScore: -1 } },
            { $limit: num_movies }
        ]).toArray();

        // Send the response
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


router.get('/ratings/:order', async (req, res) => {
    try {
        const order = req.params.order;

        // Check if the order parameter is either 'asc' or 'desc'
        if (order !== 'asc' && order !== 'desc') {
            return res.status(400).send('Invalid order parameter. It must be either "asc" or "desc".');
        }

        const sortOrder = order === 'asc' ? 1 : -1;

        // Use aggregation to count the number of ratings for each movie
        const result = await db.collection('movielens_users').aggregate([
            { $unwind: '$movies' },
            { $group: { _id: '$movies.movieid', count: { $sum: 1 }}},
            { $lookup: {from: "movielens_movies", localField: "_id", foreignField: "_id", as: "movie"}},
            { $unwind: "$movie"},
            { $addFields: { "movie.TotalRatings": "$count" }},
            { $replaceRoot: { newRoot: "$movie" }},
            { $sort: { TotalRatings: sortOrder } }
        ]).toArray();

        // Send the response
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.get("/star", async (req, res) => {
    try {
        // Use aggregation to count the number of 5-star ratings for each movie
        const result = await db.collection('movielens_users').aggregate([
            { $unwind: '$movies' },
            { $match: { 'movies.rating': 5 } },
            { $group: {_id: '$movies.movieid', count: { $sum: 1 }}},
            { $lookup: { from: "movielens_movies", localField: "_id", foreignField: "_id", as: "movie"}},
            { $unwind: "$movie"},
            { $addFields: { "movie.Rating5StarCount": "$count" }},
            { $replaceRoot: { newRoot: "$movie" }},
            { $sort: { Rating5StarCount: -1 } }
        ]).toArray();

        // Send the response
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.get('/top/age/:min_age-:max_age', async (req, res) => {
    try {
        const min_age = parseInt(req.params.min_age);
        const max_age = parseInt(req.params.max_age);

        // Use aggregation to count the number of ratings from users in the specified age range
        const result = await db.collection('movielens_users').aggregate([
            { $match: { age: { $gte: min_age, $lte: max_age } } },
            { $unwind: '$movies' },
            { $group: { _id: null, count: { $sum: 1 }}}
        ]).toArray();

        // Send the response
        res.send({ totalRatings: result[0] ? result[0].count : 0 });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.get('/users', async (req, res) => {
    try {
        // Use aggregation to calculate the max, min, and average rating for each user
        const result = await db.collection('movielens_users').aggregate([
            { $unwind: '$movies' },
            { $group: {_id: '$_id', name: { $first: '$name' }, max_rating: { $max: '$movies.rating' }, min_rating: { $min: '$movies.rating' },
                    avg_rating: { $avg: '$movies.rating' }}},
            { $sort: { avg_rating: -1 } }
        ]).toArray();

        // Send the response
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


router.get('/comments', async (req, res) => {
    try {
        // Use aggregation to count the number of comments for each movie
        const result = await db.collection('comments').aggregate([
            { $group: { _id: '$movie_id', count: { $sum: 1 }}},
            { $lookup: { from: "movielens_movies", localField: "_id", foreignField: "_id", as: "movie"}},
            { $unwind: "$movie"},
            { $addFields: { "movie.count": "$count"}},
            { $replaceRoot: { newRoot: "$movie" }},
            { $sort: { count: -1 } }
        ]).toArray();

        // Send the response
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});




// Assuming you have a User model

router.get('/occupation', async (req, res) => {
    try {
        const result = await db.collection('movielens_users').aggregate([
            { $unwind: '$movies'},
            { $group: { _id: '$occupation', numberOfRatings: { $sum: 1 }}},
            { $project: { _id: 0, occupation: '$_id', numberOfRatings: 1}},
            { $sort: { numberOfRatings: -1 }}
        ]).toArray();

        res.json(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/genres/:genre_name', async (req, res) => {
    try {
        const genreName = req.params.genre_name;
        console.log(genreName)
        const result = await db.collection('movielens_users').aggregate([
            { $unwind: '$movies'},
            { $lookup: { from: "movielens_movies", localField: "movies.movieid", foreignField: "_id", as: "movie_info"}},
            { $unwind: '$movie_info'},
            { $match: { 'movie_info.genres': { $regex: genreName, $options: 'i' } }},
            { $group: { _id: '$movie_info._id', title: { $first: '$movie_info.title' }, genres: { $first: '$movie_info.genres' }, averageRating: { $avg: '$movies.rating' }}},
            { $sort: { averageRating: -1 }}
        ]).toArray();

        res.json(result);
    } catch (err) {
        console.log(err)
        res.status(500).send(err);
    }
});

router.get('/genres/:genre_name/year/:year', async (req, res) => {
    try {
        const genreName = req.params.genre_name;
        const year = req.params.year;
        const result = await db.collection('movielens_movies').aggregate([
            { $match: { genres: { $regex: genreName, $options: 'i' }, title: { $regex: `\\(${year}\\)`, $options: 'i' }}},
            { $project: {_id: 1, title: 1, genres: 1}}
        ]).toArray();

        res.json(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.post('/user/ratings', async (req, res) => {
    try {
        const users = await db.collection('movielens_users').find().limit(100).toArray();
        const movies = await db.collection('movielens_movies').find().limit(100).toArray();
        const result = await Promise.all(users.map(async (user) => {
            const ratings = user.movies.map((movie) => {
                const movie_info = movies.find((m) => m._id === movie.movieid);
                return {
                    movie_id: movie.movieid,
                    rating: movie.rating,
                    movie_title: movie_info ? movie_info.title : 'Unknown'
                };
            });

            return {
                user_id: user._id,
                user_name: user.name,
                ratings
            };
        }));

        await db.collection('ratings_by_user').insertMany(result);

        res.json({ message: 'Ratings by user have been saved successfully.' });
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});


router.get("/originaltitle", async function(req, res) {
    try {
        const result = await db.collection("movielens_movies").aggregate([
            { $addFields: { original_title: { $regexFind: {input: "$title", regex: /\((.*?)\)/, options: "i"}}}},
            { $match: {"original_title": { $exists: true, $ne: null }}},
            { $project: { _id: 1, title: 1, genres: 1, year: 1, original_title: "$original_title.match"}}
        ]).toArray();

        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});


router.get("/:id", async (req, res) => {
    try {
        const movieId = parseInt(req.params.id);

        // Use aggregation to find the movie, calculate the average score, and find all comments
        const result = await db.collection('movielens_movies').aggregate([
            { $match: { '_id': movieId } },
            { $lookup: { from: "movielens_users", let: { "movie_id": "$_id" },
                    pipeline: [
                            { $unwind: '$movies' },
                            { $match: { $expr: { $eq: ['$movies.movieid', '$$movie_id'] } } },
                            { $group: {
                                    _id: '$movies.movieid',
                                    avgScore: { $avg: '$movies.rating' }
                                }
                            }
                        ],
                        as: "movieDetails"
                    }
            },
            { $unwind: { path: "$movieDetails", preserveNullAndEmptyArrays: true }},
            { $lookup: { from: "comments", localField: "_id", foreignField: "movie_id", as: "comments"}},
            {$addFields: {"avgScore": "$movieDetails.avgScore", "comments": "$comments"}},
            {$project: { "movieDetails": 0}}
        ]).toArray();

        // Send the response
        res.send(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

export default router;