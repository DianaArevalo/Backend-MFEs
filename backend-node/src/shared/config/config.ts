import dotenv from 'dotenv';

dotenv.config();

const env = process.env.NODE_ENV ?? 'development';
const port = Number(process.env.PORT ?? 3001);

export const config = {
  env,
  port,
  oracle: {
    host: process.env.ORACLE_HOST,
    port: process.env.ORACLE_PORT,
    serviceName: process.env.ORACLE_SERVICE_NAME,
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
  },
};