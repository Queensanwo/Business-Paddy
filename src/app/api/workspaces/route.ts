import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Use the business signup form to create a workspace and its owner together.' }, { status: 410 });
}
