import { connect } from "node:net";
import { expect, test } from "@playwright/test";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, "requests do not depend on the screen");

test("the login form refuses a body over 10 KB with 413", async ({ request, baseURL }) => {
  const origin = new URL(baseURL ?? "").origin;
  const small = await request.post("/login", { headers: { origin }, form: { email: "a".repeat(9000), password: "x" }, maxRedirects: 0 });
  expect(small.status()).not.toBe(413);
  const large = await request.post("/login", { headers: { origin }, form: { email: "a".repeat(11 * 1024), password: "x" }, maxRedirects: 0 });
  expect(large.status()).toBe(413);
  expect(await large.text()).toContain("Запрос слишком большой");
  expect(large.headers()["cache-control"]).toBe("no-store");
});

function statusForDeclaredLength(baseURL: string, path: string, length: number): Promise<{ status: number; text: string }> {
  const url = new URL(baseURL);
  return new Promise((resolve, reject) => {
    const socket = connect(Number(url.port || 80), url.hostname, () => {
      socket.write(
        `POST ${path} HTTP/1.1\r\nHost: ${url.host}\r\nOrigin: ${url.origin}\r\nContent-Type: application/octet-stream\r\nContent-Length: ${length}\r\n\r\n`,
      );
    });
    let answer = "";
    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      answer += chunk;
      const status = Number(answer.split(" ")[1]);
      if (answer.includes("\r\n\r\n") && (status !== 413 || answer.includes("МБ"))) {
        socket.destroy();
        resolve({ status: Number(answer.split(" ")[1]), text: answer });
      }
    });
    socket.on("error", reject);
    socket.setTimeout(10_000, () => reject(new Error("no answer")));
  });
}

test("other forms refuse a body over 20 MB with 413", async ({ baseURL }) => {
  const under = await statusForDeclaredLength(baseURL ?? "", "/volunteer/pets/new", 20 * 1024 * 1024);
  expect(under.status).toBe(303);
  const over = await statusForDeclaredLength(baseURL ?? "", "/volunteer/pets/new", 20 * 1024 * 1024 + 1);
  expect(over.status).toBe(413);
  expect(over.text).toContain("Запрос слишком большой: можно отправить не больше 20 МБ.");
});
