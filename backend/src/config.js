import dotenv from "dotenv";

dotenv.config();

export default {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "spotly-dev-secret",
  cookieName: process.env.COOKIE_NAME || "spotly_token",
  cookieDomain: process.env.COOKIE_DOMAIN || "localhost",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  accessTokenExpirySeconds: Number(process.env.ACCESS_TOKEN_EXPIRE_SECONDS || 86400),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  dbUrl: process.env.DATABASE_URL || "mongodb://localhost:27017/spotly",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  corsOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
  ],
};
