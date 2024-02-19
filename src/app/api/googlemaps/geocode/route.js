import { config } from "@/config";
import { NextResponse } from 'next/server';

export async function GET(req) {
    const address = req.nextUrl.searchParams.get('address');
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.googleApiKey}`);
    return NextResponse.json(await response.json());
}