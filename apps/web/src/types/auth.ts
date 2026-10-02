export type AuthenticatedUser = {
    user: {
        id: number;
        email: string;
        displayName: string;
    };

    household: {
        id: number;
        name: string;
        role: "owner" | "member";
        
    };
};