import "dotenv/config";
import express from "express";
import cors from "cors";
import {prisma} from "./lib/prisma.js";
import catalogRoutes from "./routes/catalog.routes.js";
import expenseRoutes from "./routes/expense.route.js";
import monthlyPlanRoutes from "./routes/monthly-plan.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use("/api", catalogRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/monthly-plans", monthlyPlanRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "expense-tracker-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/db-health", async (_req, res) => {
  try {
    const userCount = await prisma.user.count();
    const householdCount = await prisma.household.count();

    res.json({
      status: "ok",
      database: "expense_tracker",
      connection: "connected",
      counts: {
        users: userCount,
        households: householdCount,
      },
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      status: "error",
      database: "expense_tracker",
      connection: "failed",
    });
  }
});


app.listen(PORT, () => {
  console.log(`Expense Tracker API running on http://localhost:${PORT}`);
});
