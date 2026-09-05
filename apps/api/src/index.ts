import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "expense-tracker-api",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Expense Tracker API running on http://localhost:${PORT}`);
});
