import http from "http";
import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/config/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);

connectDB();



server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});