// Vercel parses the body before invoking the function; Express/Nest
// handles it instead (otherwise JSON payloads arrive already consumed).
// This module is compiled as CommonJS for Vercel's runtime (Node 20.14).

import { Request, Response } from 'express';
import 'dotenv/config';

import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { setupApp, setupSwagger } from '../src/setup-app';

// Express/Nest keeps the request body parser for us, so Vercel's pre-parsed
// body is untouched and JSON payloads arrive in their original format.
export const config: any = { api: { bodyParser: false } };

// The Express instance (with Nest attached) is cached across warm
// invocations so cold starts only pay the bootstrap cost once.
let cachedServer: express.Express | undefined;

async function getServer(): Promise<express.Express> {
  if (!cachedServer) {
    const server = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    setupApp(app);
    setupSwagger(app);
    await app.init();
    cachedServer = server;
  }
  return cachedServer;
}

// On Vercel Node functions, req/res are already Express-compatible, so the
// cached server handles them directly (no lambda-event adapter needed).
exports.handler = async (req: Request, res: Response) => {
  const server = await getServer();
  return server(req, res);
};

// Named helper retained for internal callers/tests.
exports.getHandler = () => getServer();

// Default export satisfies Vercel's function entry point.
module.exports = (req: Request, res: Response) => exports.handler(req, res);
