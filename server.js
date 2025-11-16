/** import packages */
process.env.TZ = "Asia/Calcutta";
const express = require("express");
const bodyParser = require("body-parser");
const { ValidationError } = require("express-validation");
const path = require("path");
const moment = require("moment");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const handleLogRequest = require("./utils/logger");
const dotenv = require("dotenv");
const QueryController = require("./controllers/queryController");
const QueryMessageController = require("./controllers/queryMessageController");

dotenv.config();

const allowedOrigins = ["https://milkyswipe.com", "http://localhost:3000"];
const PORT = process.env.PORT;

const app = express();

app.use(
  cors({
    origin: true, // Reflects the request origin
    credentials: true,
  })
);
app.use((req, res, next) => {
  console.log(
    "Request URL:",
    req.protocol + "://" + req.get("host") + req.originalUrl
  );
  next();
});
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//   }
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   next();
// });
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true); // allow all origins
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // or higher, e.g., '20mb'
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Then from 'public/uploads' if not found in 'uploads'
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
/** Routes */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/agent", require("./routes/agentRoutes"));
app.use("/api/announcement", require("./routes/announcementRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/", (req, res) => {
  res.json({ headers: req.headers, message: "Welcome to server." });
});

app.use(function (err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err);
  }
  return res.status(500).json(err);
});

let server;
if (process.env.NODE_ENV === "production") {
  const sslOptions = {
    key: fs.readFileSync("/etc/letsencrypt/live/milkyswipe.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/milkyswipe.com/fullchain.pem"),
  };
  server = https.createServer(sslOptions, app);
} else {
  server = http.createServer(app);
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.emit("connected", { message: "Socket connection established" });

  socket.on("query:list", async ({ id, role }) => {
    QueryController.listSocket(socket, id, role);
  });

  socket.on("querymessage:test", async ({ ticket_id }) => {
    QueryMessageController.listTicketMessageSocket2(socket, ticket_id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

app.set("io", io);

server.listen(PORT, () => {
  (async () => {
    // await ImapUtils.restoreConnectionsFromDB();
    console.log(
      `🚀 ${
        process.env.NODE_ENV === "production" ? "Secure" : "Dev"
      } server running at ${
        process.env.NODE_ENV === "production"
          ? `https://milkyswipe.com:${PORT}`
          : `http://localhost:${PORT}`
      }`
    );
  })().catch(console.error);
});
