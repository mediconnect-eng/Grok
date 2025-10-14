import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: false,
  },
});

// GET /api/notifications - Fetch user's notifications
export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filterType = searchParams.get('type'); // consultation, prescription, referral, diagnostic_order
    const filterRead = searchParams.get('read'); // 'true', 'false', or null for all

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build query with filters
    let query = `
      SELECT 
        id,
        user_id,
        type,
        title,
        message,
        link,
        metadata,
        entity_type,
        entity_id,
        is_read,
        read_at,
        created_at,
        updated_at
      FROM notifications
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    // Add type filter
    if (filterType) {
      query += ` AND type = $${paramIndex}`;
      params.push(filterType);
      paramIndex++;
    }

    // Add read filter
    if (filterRead === 'true') {
      query += ` AND is_read = true`;
    } else if (filterRead === 'false') {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    // Get unread count
    const unreadResult = await client.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    // Get total count (with filters)
    let countQuery = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1';
    const countParams: any[] = [userId];
    let countParamIndex = 2;

    if (filterType) {
      countQuery += ` AND type = $${countParamIndex}`;
      countParams.push(filterType);
      countParamIndex++;
    }

    if (filterRead === 'true') {
      countQuery += ` AND is_read = true`;
    } else if (filterRead === 'false') {
      countQuery += ` AND is_read = false`;
    }

    const totalResult = await client.query(countQuery, countParams);

    return NextResponse.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count),
      total: parseInt(totalResult.rows[0].count),
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST /api/notifications - Create a new notification (internal use)
export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    const {
      userId,
      type,
      title,
      message,
      link,
      metadata = {},
      entityType,
      entityId,
    } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    const result = await client.query(
      `INSERT INTO notifications 
        (user_id, type, title, message, link, metadata, entity_type, entity_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())
       RETURNING *`,
      [userId, type, title, message, link || null, JSON.stringify(metadata), entityType || null, entityId || null]
    );

    return NextResponse.json({
      success: true,
      notification: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
