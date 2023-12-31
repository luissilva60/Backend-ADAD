import express from "express";
import movies from "./routes/movies.js";
import users from "./routes/users.js";
import cinemas from "./routes/cinemas.js";
import comments from "./routes/comments.js";
import cors from "cors";

const app = express()
app.use(cors())
//const port = 3000
app.get('/', (req, res) => {
  res.send('Backend!')
})
app.use(express.json())
// Load the /movies routes
app.use("/movies", movies);
// Load the /users routes
app.use("/users", users);
app.use("/cinemas", cinemas)

app.use("/comments", comments);



app.listen(process.env.PORT || 3000)