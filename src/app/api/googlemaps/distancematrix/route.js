import { config } from "@/config";
import { NextResponse } from 'next/server';

export async function GET(req) {
    const origins = req.nextUrl.searchParams.get('origins');
    const destinations = req.nextUrl.searchParams.get('destinations');
    const distanceResponse = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${config.googleApiKey}`);

    return NextResponse.json(await distanceResponse.json());
}