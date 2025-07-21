import { updateUserStatus } from '@/lib/db';

export async function POST(req) {
  try {
    const { userId, action } = await req.json();
    if (!userId || !['activate', 'deactivate'].includes(action)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), { status: 400 });
    }
    // Use numeric status for DB
    const status = action === 'activate' ? 1 : 0;
    const result = await updateUserStatus(userId, status);
    if (result) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Failed to update user status' }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 500 });
  }
} 