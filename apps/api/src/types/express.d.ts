declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        householdId: number;
        role: string;
      };
    }
  }
}

export {};