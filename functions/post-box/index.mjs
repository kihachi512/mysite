import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';

const tableName = process.env.MOMONGA_POSTS_TABLE;
const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION })
);

const jsonResponse = (statusCode, body = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
  },
  body: JSON.stringify(body),
});

const ensureTableConfigured = () => {
  if (!tableName) {
    throw new Error('MOMONGA_POSTS_TABLE is not set.');
  }
};

const sanitizeInput = (value = '', limit = 0) => value.toString().trim().slice(0, limit || undefined);

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  try {
    ensureTableConfigured();
  } catch (error) {
    console.error(error);
    return jsonResponse(500, { message: 'Server configuration error.' });
  }

  if (event.httpMethod === 'GET') {
    try {
      const result = await dynamo.send(
        new ScanCommand({
          TableName: tableName,
        })
      );

      const items = (result.Items || [])
        .filter((item) => item && item.id && item.name && item.message)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return jsonResponse(200, { items });
    } catch (error) {
      console.error(error);
      return jsonResponse(500, { message: '投稿の取得に失敗しました。' });
    }
  }

  if (event.httpMethod === 'POST') {
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (error) {
      return jsonResponse(400, { message: 'JSONの形式が正しくありません。' });
    }

    const name = sanitizeInput(payload.name, 80);
    const message = sanitizeInput(payload.message, 1000);

    if (!name || !message) {
      return jsonResponse(422, { message: '名前とひとことは必須です。' });
    }

    const now = new Date().toISOString();
    const item = {
      id: uuid(),
      name,
      message,
      createdAt: now,
    };

    try {
      await dynamo.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );
    } catch (error) {
      console.error(error);
      return jsonResponse(500, { message: '投稿の保存に失敗しました。' });
    }

    return jsonResponse(201, { item });
  }

  return jsonResponse(405, { message: 'Method not allowed.' });
};
