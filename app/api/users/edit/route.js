import { updateUserDetails } from '@/lib/db';

export async function POST(req) {
  try {
    const { id, username, expiration_date } = await req.json();
    if (!id || !username) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), { status: 400 });
    }
    const result = await updateUserDetails(id, username, expiration_date);
    if (result) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Failed to update user' }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 500 });
  }
} 