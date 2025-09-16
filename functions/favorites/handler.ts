import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { randomBytes } from "node:crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
 type AnyEvent = any;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_FAVORITES || process.env.TABLE_THREADS;

const json = (code: number, body: unknown) => ({
  statusCode: code,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "Content-Type",
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

export const handler = async (event: AnyEvent) => {
  try {
    if (!TABLE) return json(500, { error: "misconfigured: TABLE_FAVORITES is not set" });

    const method = mOf(event);
    const path = pOf(event);
    if (method === "OPTIONS") return { statusCode: 204, headers: json(200, {}).headers, body: "" };

    const isFavRoute = path.includes("/api/favorites");

    if (isFavRoute && method === "GET") {
      const r = await ddb.send(
        new QueryCommand({
          TableName: TABLE,
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: { ":pk": "FAVORITES" },
          ScanIndexForward: false,
          Limit: 100,
        })
      );
      const items = (r.Items ?? []).map(({ pk, sk, ...rest }) => rest);
      return json(200, items);
    }

    if (isFavRoute && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const name = (body.name || "無題").toString().slice(0, 100);
      const now = new Date().toISOString();
      const id = randomBytes(6).toString("base64url");
      const item: any = { pk: "FAVORITES", sk: id, id, name, createdAt: now };

      if (typeof body.text === "string") {
        const text = body.text.toString().slice(0, 2000);
        if (!text) return json(400, { error: "empty" });
        item.kind = "text";
        item.text = text;
      } else if (typeof body.dataUrl === "string") {
        const dataUrl = body.dataUrl.toString();
        const mime = (body.mime || "").toString().slice(0, 100);
        item.kind = "file";
        item.dataUrl = dataUrl;
        item.mime = mime;
      } else {
        return json(400, { error: "invalid" });
      }

      await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
      return json(201, { id });
    }

    if (isFavRoute && method === "DELETE") {
      const id = getQueryParam(event, "id");
      if (!id) return json(400, { error: "invalid" });
      try {
        await ddb.send(
          new DeleteCommand({
            TableName: TABLE,
            Key: { pk: "FAVORITES", sk: id },
            ConditionExpression: "attribute_exists(pk)",
          })
        );
        return json(200, { ok: true });
      } catch (err: any) {
        if (err?.name === "ConditionalCheckFailedException") {
          return json(404, { error: "not found" });
        }
        throw err;
      }
    }

    return json(404, { error: "not found" });
  } catch (e) {
    console.error("ERROR", {
      message: (e as any)?.message,
      stack: (e as any)?.stack,
      path: pOf(event),
      method: mOf(event),
    });
    return json(500, { error: "internal" });
  }
};

