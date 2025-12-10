import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./screens/Login";
import Register from "./screens/Register";
import Dashboard from "./screens/Dashboard";
import Driver from "./screens/Driver";
import Passenger from "./screens/Passenger";
import Profile from "./screens/Profile";
import PassengerList from "./screens/PassengerList";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/driver" element={<Driver />} />
        <Route path="/passenger" element={<Passenger />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/passenger/results" element={<PassengerList />} />
      </Routes>
    </Router>
  );
}

export default App;
