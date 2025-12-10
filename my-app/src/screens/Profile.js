import React, { useState, useEffect } from "react";
import "./css/Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    const savedImage = localStorage.getItem("profileImage");

    setUser(savedUser);
    if (savedImage) setProfileImage(savedImage);
  }, []);

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
        <p>{user.email}</p>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
