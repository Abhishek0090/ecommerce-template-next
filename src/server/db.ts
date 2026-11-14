import "server-only";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { categories as seedCategories } from "@/data/categories";
import { products as seedProducts } from "@/data/products";
import { seedReviews } from "@/data/reviews";
import type { Category, Order, Product, Review } from "@/data/types";

/**
 * File-backed data store: one JSON document in DATA_DIR (default ./.data).
 * Good for local use, demos and single-server hosting. For serverless hosts or
 * multiple servers, reimplement src/server/repo.ts against a real database;
 * nothing else reads this file.
 */
export type Db = {
  version: 1;
  products: Product[];
  categories: Category[];
  reviews: Review[];
  orders: Order[];
};

export const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), ".data");
const DB_FILE = join(DATA_DIR, "db.json");

function seed(): Db {
  return {
    version: 1,
    products: structuredClone(seedProducts),
    categories: structuredClone(seedCategories),
    reviews: structuredClone(seedReviews),
    orders: [],
  };
}

async function load(): Promise<Db> {
  if (!existsSync(DB_FILE)) {
    const db = seed();
    await persist(db);
    return db;
  }
  return JSON.parse(await readFile(DB_FILE, "utf8")) as Db;
}

async function persist(db: Db) {
  await mkdir(DATA_DIR, { recursive: true });
  // Write to a temp file then rename, so a crash never leaves a half-written database.
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await rename(tmp, DB_FILE);
}

// Every read and write goes through one queue so concurrent requests can't interleave.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

export function readDb(): Promise<Db> {
  return enqueue(load);
}

/** Runs `change` on the current data and saves the result. Throw inside to abort without saving. */
export function updateDb<T>(change: (db: Db) => T | Promise<T>): Promise<T> {
  return enqueue(async () => {
    const db = await load();
    const result = await change(db);
    await persist(db);
    return result;
  });
}

/** Restores the demo data. Used by the "Reset demo data" button in admin settings. */
export function resetDb(): Promise<void> {
  return enqueue(() => persist(seed()));
}
