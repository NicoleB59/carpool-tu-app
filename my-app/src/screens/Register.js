import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./css/Register.css";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
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
    alert("Please use your TU Dublin email (@tudublin.ie or @mytudublin.ie)");
    return;
  }


  if (form.password !== form.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            passwordConfirmation: form.confirmPassword,
            gender: form.gender,
        }),
    });
    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: "",
    });

        const data = await res.json();

        if (res.ok) {
        alert("Registration successful!");
            setForm({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                gender: "",
            });
        } else {
            alert(data.message || "Registration failed");
        }

        } catch (error) {
            alert("Server connection failed");
        }
    };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="title">TU Dublin</h1>
        <p className="subtitle">Create your account</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />

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

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>

          <input
            type="text"
            name="gender"
            placeholder="Gender (optional)"
            value={form.gender}
            onChange={handleChange}
            required
          />

          <button type="submit">Register</button>
        </form>

        <p className="login-text">
          Already have an account?{" "}
          <Link to="/" className="login-link">
            Login
          </Link>
        </p>


      </div>
    </div>
  );
}
