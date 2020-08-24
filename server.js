const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Fuck Scott");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server up on port ${PORT}...`));
