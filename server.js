import fs from "fs";
import path from "path";

const BASE_PATH = ".";
const server = Bun.serve({
  port: 80,
  async fetch(request) {
    const pathname = new URL(request.url).pathname;
    const filePath = `${BASE_PATH}${pathname != "/" ? pathname : "/index.html"}`;
    // console.log(filePath);
    return new Response(Bun.file(filePath));
  },
  error() {
    return new Response(null, { status: 404 });
  },
});

console.log(`Listening on localhost:${server.port}`);
