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
        incoming: string;
        spent: string;
        remaining: string;
        utilizationPercent: number | null;
        status: "OK" | "OVERSPENT";
    };

    categories: DashboardCategory[];
}