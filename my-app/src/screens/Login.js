import React, { useState } from "react";
import "./css/Register.css"; // reuse your theme

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validDomains = ["@tudublin.ie", "@mytudublin.ie"];
    const isValidEmail = validDomains.some((domain) =>
      form.email.toLowerCase().endsWith(domain)
    );

    if (!isValidEmail) {
      alert("Please use your TU Dublin email");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login successful!");
        console.log("Logged in user:", data.user);

        // Save user session (basic)
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Could not connect to server");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="title">TU Dublin</h1>
        <p className="subtitle">Login to your account</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="TU Dublin Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit">Login</button>
        </form>

        <p className="login-text">
          Don’t have an account?{" "}
          <span onClick={() => (window.location.href = "/register")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
