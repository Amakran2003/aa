import { createHash } from "node:crypto";
import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ProductSheet } from "@aa/contracts";
import { findSheet, upsertSheet } from "@aa/db";
import Redis from "ioredis";

const QUEUE = "aa:enrich";
const cacheKey = (url: string) => `aa:sheet:${url}`;

let redis: Redis | null = null;
let redisFailed = false;
let bucketReady = false;

function sheetOf(value: unknown): ProductSheet | null {
  if (!value || typeof value !== "object") return null;
  const sheet = value as ProductSheet;
  if (typeof sheet.url !== "string") return null;
  return sheet;
}

async function cache(): Promise<Redis | null> {
  if (redisFailed || !process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    try {
      await redis.connect();
    } catch {
      redisFailed = true;
      redis = null;
      return null;
    }
  }
  return redis;
}

function bucket(): S3Client | null {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function htmlKey(url: string): string {
  return `sheets/${createHash("sha256").update(url).digest("hex")}.html`;
}

async function ensureBucket(client: S3Client, name: string): Promise<void> {
  if (bucketReady) return;
  try {
    await client.send(new HeadBucketCommand({ Bucket: name }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: name }));
  }
  bucketReady = true;
}

export async function recall(url: string): Promise<ProductSheet | null> {
  try {
    const client = await cache();
    const hit = client ? await client.get(cacheKey(url)) : null;
    if (hit) return sheetOf(JSON.parse(hit));
  } catch {
    /* le cache rate, on lit Postgres */
  }
  try {
    const stored = sheetOf(await findSheet(url));
    if (!stored) return null;
    const client = await cache();
    if (client) await client.set(cacheKey(url), JSON.stringify(stored), "EX", 60 * 60 * 24);
    return stored;
  } catch {
    return null;
  }
}

export async function remember(sheet: ProductSheet, html?: string): Promise<void> {
  let key: string | null = null;
  const name = process.env.S3_BUCKET;
  const client = bucket();
  if (html && client && name) {
    try {
      await ensureBucket(client, name);
      key = htmlKey(sheet.url);
      await client.send(new PutObjectCommand({ Bucket: name, Key: key, Body: html, ContentType: "text/html" }));
    } catch {
      key = null;
    }
  }
  try {
    await upsertSheet(sheet.url, sheet, key);
  } catch {
    /* la fiche s'affiche quand même */
  }
  try {
    const store = await cache();
    if (store) await store.set(cacheKey(sheet.url), JSON.stringify(sheet), "EX", 60 * 60 * 24);
  } catch {
    /* idem */
  }
}

export async function enqueueEnrich(url: string): Promise<void> {
  try {
    const client = await cache();
    if (!client) return;
    await client.lpush(QUEUE, url);
  } catch {
    /* le worker reprendra plus tard */
  }
}

export async function takeEnrich(): Promise<string | null> {
  const client = await cache();
  if (!client) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return null;
  }
  const row = await client.brpop(QUEUE, 5);
  return row?.[1] ?? null;
}
