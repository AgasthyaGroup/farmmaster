import { login, register } from '@/delivery-application/controllers/auth';

export async function POST(request: any) {
  return login(request);
}

// Optional register endpoint for easy testing/seeding of Delivery Executives
export async function PUT(request: any) {
  return register(request);
}
