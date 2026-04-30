import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../screens/css/PassengerList.css";
import { toast } from "react-toastify";

export default function Review() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = async () => {
    if (!comment.trim()) {
      toast.success("Please write a short review.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewerEmail: user.email,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Review submitted!");
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Review error:", error);
      toast.error("Server error submitting review");
    }
  };

  return (
    <div className="passenger-list-container">
      <h2>Leave a Review</h2>

      <div className="driver-card">
        <div className="info-row">
          <strong>Rating:</strong>
        </div>

        <select
          className="driver-input"
          style={{ width: "100%", marginBottom: "15px" }}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
          <option value={4}>⭐⭐⭐⭐ Good</option>
          <option value={3}>⭐⭐⭐ Okay</option>
          <option value={2}>⭐⭐ Poor</option>
          <option value={1}>⭐ Very Poor</option>
        </select>

        <textarea
          className="driver-input"
          style={{
            width: "100%",
            minHeight: "120px",
            resize: "none",
            padding: "12px",
          }}
          placeholder="Write your review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button className="request-btn" onClick={submitReview}>
          Submit Review
        </button>

        <button className="small-action-btn" onClick={() => navigate("/dashboard")}>
          Skip
        </button>
      </div>
    </div>
  );
}