import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { randomBytes } from "node:crypto";

type AnyEvent = any;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_THREADS;

const json = (code: number, body: unknown) => ({
  statusCode: code,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "Content-Type"
  },
  body: JSON.stringify(body),
});

const mOf = (e: AnyEvent) => e?.httpMethod || e?.requestContext?.http?.method || e?.requestContext?.httpMethod || "";
const pOf = (e: AnyEvent) => (e?.path || e?.rawPath || e?.resourcePath || "") as string;

function getQueryParam(e: AnyEvent, key: string): string {
  if (e?.rawQueryString) {
    const sp = new URLSearchParams(e.rawQueryString);
    const v = sp.get(key);
    if (v != null) return v;
  }
  if (e?.multiValueQueryStringParameters?.[key]?.length) {
    return e.multiValueQueryStringParameters[key][0];
  }
  if (e?.queryStringParameters?.[key] != null) {
    return e.queryStringParameters[key];
  }
  return "";
}

const normId = (raw: string) => {
  let id = raw ?? "";
  try { id = decodeURIComponent(id); } catch {}
  id = id.replace(/ /g, "+");
  return id;
};

export const handler = async (event: AnyEvent) => {
  try {
    if (!TABLE) {
      return json(500, { error: "misconfigured: TABLE_THREADS is not set" });
    }
    const method = mOf(event);
    const path   = pOf(event);

    if (method === "OPTIONS") return { statusCode: 204, headers: json(200, {}).headers, body: "" };

    const isThreadsRoute  = /\/(api\/)?threads(\b|\/)/.test(path);
    const isThreadIdPath  = /\/(api\/)?threads\/[^/]+$/.test(path);
    const isRepliesIdPath = /\/(api\/)?threads\/[^/]+\/replies$/.test(path);

    // GET /api/threads  （一覧 or ?id=... で詳細）
    if (isThreadsRoute && method === "GET" && !isThreadIdPath) {
      const qid = normId(getQueryParam(event, "id"));
      if (!qid) {
        const r = await ddb.send(new QueryCommand({
          TableName: TABLE,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :g",
          ExpressionAttributeValues: { ":g": "THREADS" },
          ScanIndexForward: false,
          Limit: 30,
        }));
        return json(200, r.Items ?? []);
      }

      let meta = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "pk = :pk AND sk = :meta",
        ExpressionAttributeValues: { ":pk": `THREAD#${qid}`, ":meta": "META" },
        Limit: 1,
      }));

      if (!meta.Items?.length) {
        const fb = await ddb.send(new QueryCommand({
          TableName: TABLE,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :g",
          ExpressionAttributeValues: { ":g": "THREADS", ":pkv": `THREAD#${qid}`, ":m": "META" },
          FilterExpression: "pk = :pkv AND sk = :m",
          Limit: 1,
          ScanIndexForward: false,
        }));
        if (fb.Items?.length) meta = { Items: fb.Items } as any;
      }
      if (!meta.Items?.length) return json(404, { error: "not found" });

      const replies = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :r)",
        ExpressionAttributeValues: { ":pk": `THREAD#${qid}`, ":r": "REPLY#" },
        ScanIndexForward: true,
        Limit: 100,
      }));
      return json(200, { thread: meta.Items[0], replies: replies.Items ?? [] });
    }

    // POST /api/threads  （新規 or ?id=... で返信）
    if (isThreadsRoute && method === "POST" && !isRepliesIdPath) {
      const qid = normId(getQueryParam(event, "id"));
      const body = JSON.parse(event.body || "{}");

      if (qid) {
        const name = (body.name || "匿名").toString().slice(0,40);
        const msg  = (body.body || "").toString().trim().slice(0,800);
        if (!msg) return json(400, { error:"empty" });

        const now = new Date().toISOString();
        await ddb.send(new PutCommand({ TableName: TABLE, Item:{ pk:`THREAD#${qid}`, sk:`REPLY#${now}`, name, body: msg, createdAt: now }}));
        await ddb.send(new UpdateCommand({
          TableName: TABLE, Key:{ pk:`THREAD#${qid}`, sk:"META" },
          UpdateExpression:"SET updatedAt=:u, GSI1SK=:u", ExpressionAttributeValues:{":u":now}
        }));
        return json(201, { ok:true });
      }

      const name = (body.name || "匿名").toString().slice(0,40);
      const text  = (body.body  || "").toString().trim().slice(0, 1000);
      if (!text) return json(400, { error: "empty" });

      const now = new Date().toISOString();
      const newId  = randomBytes(6).toString("base64url");

      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: { pk:`THREAD#${newId}`, sk:"META", name, body:text, createdAt:now, updatedAt:now, GSI1PK:"THREADS", GSI1SK:now }
      }));
      return json(201, { id: newId });
    }

    if (isThreadsRoute && method === "DELETE" && !isRepliesIdPath) {
      const qid = normId(getQueryParam(event, "id"));
      if (!qid) return json(400, { error: "invalid" });

      const items = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": `THREAD#${qid}` },
        Limit: 200,
      }));
      if (!items.Items?.length) return json(404, { error: "not found" });

      for (const it of items.Items) {
        await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { pk: it.pk, sk: it.sk } }));
      }
      return json(200, { ok: true });
    }

    // 旧PATH互換
    if (isThreadIdPath && method === "GET") {
      const id = path.split("/").pop()!;
      const meta = await ddb.send(new QueryCommand({
        TableName: TABLE, KeyConditionExpression:"pk = :pk AND sk = :meta",
        ExpressionAttributeValues:{":pk":`THREAD#${id}`,":meta":"META"}, Limit:1
      }));
      if (!meta.Items?.length) return json(404, { error: "not found" });
      const replies = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression:"pk = :pk AND begins_with(sk, :r)",
        ExpressionAttributeValues:{":pk":`THREAD#${id}`,":r":"REPLY#"},
        ScanIndexForward:true, Limit:100
      }));
      return json(200, { thread: meta.Items[0], replies: replies.Items ?? [] });
    }

    if (isRepliesIdPath && method === "POST") {
      const parts = path.split("/");
      const id = parts[parts.length-2];
      const body = JSON.parse(event.body || "{}");
      const name = (body.name || "匿名").toString().slice(0,40);
      const msg  = (body.body || "").toString().trim().slice(0,800);
      if (!msg) return json(400, { error:"empty" });

      const now = new Date().toISOString();
      await ddb.send(new PutCommand({ TableName: TABLE, Item:{ pk:`THREAD#${id}`, sk:`REPLY#${now}`, name, body: msg, createdAt: now }}));
      await ddb.send(new UpdateCommand({
        TableName: TABLE, Key:{ pk:`THREAD#${id}`, sk:"META" },
        UpdateExpression:"SET updatedAt=:u, GSI1SK=:u", ExpressionAttributeValues:{":u":now}
      }));
      return json(201, { ok:true });
    }

    return json(404, { error: "not found" });
  } catch (e:any) {
    console.error("ERROR", { message: e?.message, stack: e?.stack, path: pOf(event), method: mOf(event), rawQS: (event as any)?.rawQueryString, qs: (event as any)?.queryStringParameters, mqs: (event as any)?.multiValueQueryStringParameters });
    return json(500, { error: "internal" });
  }
};
