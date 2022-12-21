import cors from "cors";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import petsData from "./db/pets.json" assert { type: "json" };
import reviewsData from "./db/reviews.json" assert { type: "json" };
import termsData from "./db/terms.json" assert { type: "json" };

// Import the 'promises' object from the 'fs' module and rename it to 'fs'
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import router from "./routes/index.js";

// Start express
const app = express();

// TODO: Get port from environment variables (via config)
const port = 3001;

// Any requests that come to "/api" will be handled by the router
app.use("/api", router);

app.get("/api/reviews", (_, res) => {
  res.json(reviewsData);
});

app.get("/api/reviews/:id", (req, res) => {
  const { id } = req.params;

  // Find the review whose 'review_id' matches the id from the DYNAMIC PARAMETER in 'req.params'
  const requestedReview = reviewsData.find((review) => review.review_id === id);

  if (requestedReview) {
    res.json(requestedReview);
  } else {
    res.status(404).json({ error: `Review ${id} not found. :(` });
  }
});

app.get("/api/reviews/:id/upvotes", (req, res) => {
  const { id } = req.params;

  // Find the review whose 'review_id' matches the id from the DYNAMIC PARAMETER in 'req.params'
  const requestedReview = reviewsData.find((review) => review.review_id === id);

  if (requestedReview) {
    res.json({ upvotes: requestedReview.upvotes });
  } else {
    res.status(404).json({ error: `Review ${id} not found. :(` });
  }
});

// Add middleware to parse JSON bodies
// This must be added BEFORE the POST request handler
app.use(express.json());

// Use this to create a new review
app.post("/api/reviews", async (req, res) => {
  const { product, username, review } = req.body;

  const newReview = {
    ...req.body,
    review_id: uuidv4(),
    upvotes: 0,
  };

  // TODO: Remove any properties from the body that don't belong
  if (product && username && review) {
    try {
      await fs.writeFile(
        `${path.dirname(fileURLToPath(import.meta.url))}/db/reviews.json`,
        JSON.stringify([...reviewsData, newReview], null, 2),
        "utf-8"
      );
      res.status(201).json({ status: "success", body: newReview });
    } catch (err) {
      res.status(500).json({ error: `Something went wrong. ${err.message}` });
    }
  } else {
    res.status(400).json({ error: "Missing required properties" });
  }
});

app.put("/api/reviews/:id/upvotes", async (req, res) => {
  const { id } = req.params;

  const requestedReview = reviewsData.find((review) => review.review_id === id);

  if (requestedReview) {
    const updatedReview = {
      ...requestedReview,

      // This will override what we just spread out
      upvotes: requestedReview.upvotes + 1,
    };

    try {
      await fs.writeFile(
        `${path.dirname(fileURLToPath(import.meta.url))}/db/reviews.json`,
        JSON.stringify(
          reviewsData.map((review) =>
            // If the review's id matches the id from the DYNAMIC PARAMETER, return the updated review otherwise, keep the review as is
            review.review_id === id ? updatedReview : review
          ),
          null,
          2
        ),
        "utf-8"
      );
      res.json(updatedReview);
    } catch (err) {
      res.status(500).json({ error: `Something went wrong. ${err.message}` });
    }
  } else {
    res.status(404).json({ error: `Review ${id} not found. :(` });
  }
});

app.listen(port, () => {
  console.info("Server running on port 3001");
});
