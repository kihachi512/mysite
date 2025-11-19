import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

const bucketName = process.env.MOMONGA_POSTS_BUCKET;
const objectKey = process.env.MOMONGA_POSTS_KEY || 'momonga-posts.json';
const s3 = new S3Client({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION });

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

const ensureStorageConfigured = () => {
  if (!bucketName) {
    throw new Error('MOMONGA_POSTS_BUCKET is not set.');
  }
};

const parseJsonArray = (text = '[]') => {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse stored posts:', error);
    return [];
  }
};

const loadPosts = async () => {
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    );

    const body = await response.Body?.transformToString();
    return parseJsonArray(body || '[]');
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return [];
    }

    console.error('Failed to load posts:', error);
    throw new Error('ストレージから投稿を取得できませんでした。');
  }
};

const savePosts = async (items = []) => {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: JSON.stringify(items, null, 2),
        ContentType: 'application/json; charset=utf-8',
      })
    );
  } catch (error) {
    console.error('Failed to save posts:', error);
    throw new Error('投稿の保存に失敗しました。');
  }
};

const sanitizeInput = (value = '', limit = 0) => value.toString().trim().slice(0, limit || undefined);

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  try {
    ensureStorageConfigured();
  } catch (error) {
    console.error(error);
    return jsonResponse(500, { message: 'Server configuration error.' });
  }

  if (event.httpMethod === 'GET') {
    try {
      const items = (await loadPosts())
        .filter((item) => item && item.id && item.name && item.message && item.createdAt)
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
      const items = await loadPosts();
      items.push(item);

      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      await savePosts(items);
    } catch (error) {
      console.error(error);
      return jsonResponse(500, { message: '投稿の保存に失敗しました。' });
    }

    return jsonResponse(201, { item });
  }

  return jsonResponse(405, { message: 'Method not allowed.' });
};
