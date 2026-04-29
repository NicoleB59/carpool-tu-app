import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./screens/Login";
import Register from "./screens/Register";
import Dashboard from "./screens/Dashboard";
import Driver from "./screens/Driver";
import Passenger from "./screens/Passenger";
import Profile from "./screens/Profile";
import PassengerLists from "./screens/PassengerLists";
import DriverRequests from "./screens/DriverRequests";
import Sustainability from "./screens/sustainability";
import Chatroom from "./screens/Chatroom";

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
        <Route path="/passenger/results" element={<PassengerLists />} />
        <Route path="/driver/requests" element={<DriverRequests />} />
        <Route path="/sustainability" element={<Sustainability />} />
        <Route path="/chatroom" element={<Chatroom />} />
      </Routes>
    </Router>
  );
}

export default App;
