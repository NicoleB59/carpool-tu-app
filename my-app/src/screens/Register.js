import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./css/Register.css";
import logo from "../assets/carpool-logo.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const navigate = useNavigate();
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
            if (res.ok) {
              localStorage.setItem(
                "user",
                JSON.stringify({
                  name: form.name,
                  email: form.email,
                  gender: form.gender,
                })
              );

              setForm({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                gender: "",
              });
            }
            navigate("/dashboard");
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
        <img src={logo} alt="Carpool Logo" className="register-logo-img" />

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
