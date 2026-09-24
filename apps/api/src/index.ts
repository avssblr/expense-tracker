import "dotenv/config";
import express from "express";
import cors from "cors";
import {prisma} from "./lib/prisma.js";
import catalogRoutes from "./routes/catalog.routes.js";
import expenseRoutes from "./routes/expense.route.js";
import monthlyPlanRoutes from "./routes/monthly-plan.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import authRoutes from "./routes/auth.routes.js";
import {
  requireAuth,
} from "./middleware/auth.middleware.js";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

//1. Public health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "expense-tracker-api",
    timestamp: new Date().toISOString(),
  });
});

//2. Public login endpoint
app.use("/api/auth", authRoutes);

//3. Authentication middleware
//All routes below this require authentication
app.use(requireAuth);


//4. Protected database health endpoint
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

//5. Protected financial APIs 
//These are outside the db-health endpoint
app.use("/api", catalogRoutes);

app.use("/api/expenses", expenseRoutes);

app.use("/api/monthly-plans", monthlyPlanRoutes);

app.use("/api/budgets", budgetRoutes);

app.use("/api/dashboard", dashboardRoutes);

//6. Start Express
app.listen(PORT, () => {
  console.log(`Expense Tracker API running on http://localhost:${PORT}`);
});
