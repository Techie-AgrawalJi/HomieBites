import connectDB from './config/db';
import app from './app';

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

export default app;
