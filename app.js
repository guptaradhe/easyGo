// const express = require("express");
// require("dotenv").config();
// const path = require("path");
// const app = express();
// const PORT = process.env.PORT || 8080;

// // Serve static files from the botUploads folder
// app.use(express.static(path.join(__dirname, "botUploads")));

// app.use(express.json());

// // Serve a PDF file at /pdf route
// app.get("/pdf", (req, res) => {
//   console.log("Serving PDF file...");

//   // Set content type for PDF
//   res.setHeader("Content-Type", "application/pdf");

//   // Send the PDF file
//   res.sendFile(
//     path.join(
//       __dirname,
//       "botUploads",
//       "1726287367791-330168790-Leedana V1.0.0 Software Brief.pdf"
//     )
//   );
// });

// // Start the server
// app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// const express = require("express");
// require("dotenv").config();
// const path = require("path");
// const app = express();
// const PORT = process.env.PORT || 8080;

// app.use(express.static(path.join(__dirname, "botUploads")));

// app.use(express.json());
// // Serve an image at /image route
// app.get("/image/:filename", (req, res) => {
//   const filename = req.params.filename; // Get the filename from the URL
//   const filePath = path.join(__dirname, "botUploads", filename);

//   // Send the image file
//   res.sendFile(filePath, (err) => {
//     if (err) {
//       console.error("Error sending file:", err);
//       res.status(404).send("File not found");
//     }
//   });
// });

// // Start the server
// app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

const express = require("express");
require("dotenv").config();
const path = require("path");

const cors = require("cors");
const routes = require("./routes/routes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();
const PORT = process.env.PORT || 8080;

// Use CORS middleware
// app.use(cors());
// Serve static files from the botUploads folder
app.use(express.static(path.join(__dirname, "botUploads")));

app.use(function (req, res, next) {
  //Enabling CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization"
  );
  next();
});

app.use(express.json());

app.use("/", routes);

// Serve an image with a dynamic filename in the URL
app.get("/image/:filename", (req, res) => {
  const filename = req.params.filename; // Get the filename from the URL
  const filePath = path.join(__dirname, "botUploads", filename);

  // Send the image file
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(404).send("File not found");
    }
  });
});

app.use(errorMiddleware);
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
