import React, { useState, useEffect } from "react";
import "./css/Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    const savedImage = localStorage.getItem("profileImage");

    setUser(savedUser);
    if (savedImage) setProfileImage(savedImage);

    if (savedUser?.email) {
      fetchReviews(savedUser.email);
    }
  }, []);

  const fetchReviews = async (email) => {
    try {
      const res = await fetch(`http://localhost:5000/reviews/${email}`);
      const data = await res.json();

      if (res.ok) {
        setReviews(data);
      }
    } catch (error) {
      console.error("Review fetch error:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      localStorage.setItem("profileImage", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!user) return <h2 style={{ textAlign: "center" }}>Not logged in</h2>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-image-wrapper">
          <img
            src={profileImage || "/profile.png"}
            alt="Profile"
            className="profile-image"
          />
        </div>

        <label className="upload-btn">
          Upload Image
          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
        </label>

        <h2>{user.name}</h2>

        <p>
          <strong>Email:</strong>{" "}
          {user.email}
        </p>

        <p>
          <strong>Gender:</strong>{" "}
          {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "Not set"}
        </p>

        <div className="reviews-section">
          <h3>My Reviews</h3>

          {reviews.length === 0 ? (
            <p>No reviews left yet.</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="review-card">
                <p><strong>Rating:</strong> {"⭐".repeat(review.rating)}</p>
                <p>{review.comment}</p>
              </div>
            ))
          )}
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}