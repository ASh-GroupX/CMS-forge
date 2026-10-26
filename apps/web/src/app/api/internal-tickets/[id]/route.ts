import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const cookieHeader = request.headers.get('cookie') ?? '';
  const csrfToken = request.headers.get('x-csrf-token');

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    };
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(`${apiUrl}/internal-tickets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    });

    if (res.ok) {
      return NextResponse.json({ ok: true });
    } else {
      const errorText = await res.text();
      return NextResponse.json(
        { error: 'Failed to delete internal ticket', details: errorText },
        { status: res.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
