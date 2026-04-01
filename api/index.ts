import app from '../server/src/app';
import connectDB from '../server/src/config/db';

export default async function handler(req: any, res: any) {
  try {
    await connectDB(3, 300);
    return (app as any)(req, res);
  } catch (error: any) {
    const message = error?.message || 'Database connection failed';
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message }));
  }
}