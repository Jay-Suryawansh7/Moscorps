import app from './app';

const PORT: number = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

export default server;