export type DashboardCategory = {
    categoryId: number;
    category: string;
    budget: string;
    spent: string;
    remaining: string;
    utilizationPercent: number | null;
    status: "OK" | "WARNING" | "CRITICAL" | "EXCEEDED";
}

export type Dashboard = {
    month: string;

    summary: {
        budgetTotal: string;
        carryForward: string;
        incoming: string;
        spent: string;
        remaining: string;
        utilizationPercent: number | null;
        status: "OK" | "OVERSPENT";
        
        carryForwardApplied: boolean;

        carryForwardSourceMonth: string | null;

        isClosed: boolean;
    };

    dailySpending: {
        date: string;
        amount: string;
    }[];

    spendingDistribution: {
        categoryId: number;
        category: string;
        amount: string;
    }[];

    comparison: {
        income: string;
        expenses: string;
    };

    categories: DashboardCategory[];
}