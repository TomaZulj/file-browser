function readPort(): number {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got "${process.env.PORT}"`);
  }
  return port;
}

export const config = {
  port: readPort(),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://files:files@localhost:5432/files',
};
