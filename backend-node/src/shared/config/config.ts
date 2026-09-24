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
    service: process.env.ORACLE_SERVICE ?? process.env.ORACLE_SERVICE_NAME,
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    pool: {
      min: process.env.ORACLE_POOL_MIN,
      max: process.env.ORACLE_POOL_MAX,
      increment: process.env.ORACLE_POOL_INCREMENT,
    },
  },
};