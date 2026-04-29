import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../screens/css/PassengerList.css";

export default function Chatroom() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const rideRequestId = state?.rideRequestId;
    const destination = state?.destination;
    const start = state?.start;

    const user = JSON.parse(localStorage.getItem("user"));

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    const fetchMessages = async () => {
    if (!rideRequestId) return;

    try {
      const res = await fetch(`http://localhost:5000/messages/${rideRequestId}`);
      const data = await res.json();

      if (res.ok) {
        setMessages(data);
      } else {
        alert(data.message || "Failed to load messages");
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
      alert("Server error loading messages");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [rideRequestId]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const res = await fetch("http://localhost:5000/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideRequestId,
          senderEmail: user.email,
          message,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("");
        fetchMessages();
      } else {
        alert(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Send message error:", error);
      alert("Server error sending message");
    }
  };

    const startDrive = async () => {
        try {
            const res = await fetch(`http://localhost:5000/rides/request/${rideRequestId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "started" }),
            });

            if (res.ok) {
                alert("Drive started!");
                navigate("/drive-tracking", {
                    state: {
                        rideRequestId,
                        destination,
                        start,
                    },
                });
            } else {
            alert("Failed to start drive");
            }
        } catch (error) {
            console.error(error);
            alert("Server error starting drive");
        }
    };

    const completeDrive = async () => {
      try {
        const res = await fetch(`http://localhost:5000/rides/request/${rideRequestId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });

        if (res.ok) {
          alert("Drive completed!");
          navigate("/sustainability");
        } else {
          alert("Failed to complete drive");
        }
      } catch (error) {
        console.error(error);
        alert("Server error completing drive");
      }
    };

  if (!rideRequestId) {
    return (
      <div className="passenger-list-container">
        <h2>No Chat Selected</h2>
        <button className="small-action-btn" onClick={() => navigate("/dashboard")}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="passenger-list-container">
      <h2>Ride Chat</h2>

      <div className="driver-card">
        {messages.length === 0 ? (
          <p>No messages yet. Send the first message.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="info-row">
              <strong>
                {msg.senderEmail === user.email ? "You" : msg.senderEmail}:
              </strong>{" "}
              {msg.message}
            </div>
          ))
        )}

        <input
          className="driver-input"
          style={{ width: "100%", marginTop: "15px" }}
          placeholder="Type meet-up details..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button className="request-btn" onClick={sendMessage}>
            Send Message
        </button>

        <button className="request-btn" onClick={startDrive}>
            Start Drive
        </button>

        <button className="request-btn" onClick={completeDrive}>
            Complete Drive
        </button>

        <button className="small-action-btn" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
        </button>
      </div>
    </div>
  );
}