import { proxyMutation } from "@/lib/backend-mutation";

export async function POST(request: Request){
  return proxyMutation(
    request, "/api/expenses", "POST"  
  );
}