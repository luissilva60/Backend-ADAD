import express from "express";
import movies from "./routes/movies.js";
import users from "./routes/users.js";
import comments from "./routes/comments.js";
import cors from "cors";

const app = express()
app.use(cors())
const port = 3000
app.get('/', (req, res) => {
  res.send('Backend!')
})
app.use(express.json())
// Load the /movies routes
app.use("/movies", movies);
// Load the /users routes
app.use("/users", users);

app.use("/comments", comments);
app.listen(port, () => {
  console.log(`backend listening on port ${port}`)
})