// SEND MESSAGE
app.post("/messages", async (req, res) => {
  const { rideRequestId, senderEmail, message } = req.body;

  if (!rideRequestId || !senderEmail || !message) {
    return res.status(400).json({ message: "Missing message details" });
  }

  try {
    const newMessage = {
      rideRequestId,
      senderEmail,
      message,
      sentAt: new Date(),
    };

    await messagesCollection.insertOne(newMessage);
    res.status(201).json({ message: "Message sent" });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// GET MESSAGES
app.get("/messages/:rideRequestId", async (req, res) => {
  const { rideRequestId } = req.params;

  try {
    const messages = await messagesCollection
      .find({ rideRequestId })
      .sort({ sentAt: 1 })
      .toArray();

    res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch Messages Error:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});