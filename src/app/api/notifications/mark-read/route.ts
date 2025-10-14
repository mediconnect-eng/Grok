import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: false,
  },
});

// POST /api/notifications/mark-read - Mark notification(s) as read
export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { notificationId, notificationIds, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Mark single notification as read
    if (notificationId) {
      const result = await client.query(
        `UPDATE notifications 
         SET is_read = true, read_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND is_read = false
         RETURNING *`,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Notification not found or already read' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        notification: result.rows[0],
      });
    }

    // Mark multiple notifications as read
    if (notificationIds && Array.isArray(notificationIds)) {
      const result = await client.query(
        `UPDATE notifications 
         SET is_read = true, read_at = NOW(), updated_at = NOW()
         WHERE id = ANY($1::text[]) AND user_id = $2 AND is_read = false
         RETURNING id`,
        [notificationIds, userId]
      );

      return NextResponse.json({
        success: true,
        markedCount: result.rowCount,
        notificationIds: result.rows.map(row => row.id),
      });
    }

    // Mark all notifications as read for user
    const result = await client.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND is_read = false
       RETURNING id`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      markedCount: result.rowCount,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
