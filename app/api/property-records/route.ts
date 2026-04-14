import { NextRequest, NextResponse } from 'next/server'

// Property records integration — pulls from county/city APIs
// Supports multiple county data sources; falls back to placeholder data
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const zip     = searchParams.get('zip')

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 })
  }

  // In production: integrate with county parcel APIs
  // Common sources:
  //   - Maricopa County: https://mcassessor.maricopa.gov/
  //   - General: https://www.zillow.com/research/data/ (licensing required)
  //   - ATTOM Data API: https://api.attomdata.com/
  //   - Regrid: https://regrid.com/api
  //   - Local county GIS endpoints

  // Example ATTOM integration (requires API key):
  // const res = await fetch(
  //   `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/expandedprofile?address1=${encodeURIComponent(address)}&address2=${zip}`,
  //   { headers: { apikey: process.env.ATTOM_API_KEY ?? '', accept: 'application/json' } }
  // )
  // const data = await res.json()

  // Placeholder response for demo
  const mockData = {
    source: 'Demo — configure ATTOM_API_KEY or county GIS endpoint',
    address,
    parcelNumber: '123-45-678-901',
    propertyType: 'Single Family Residential',
    yearBuilt:    1987,
    sqFootage:    2150,
    bedrooms:     3,
    bathrooms:    2,
    lotSize:      7840,
    zoning:       'R1 — Single Family',
    lastSaleDate: '2018-04-15',
    lastSalePrice: 285000,
    assessedValue: 310000,
    permits: [
      { year: 2019, type: 'Electrical — Panel Upgrade', status: 'Final' },
      { year: 2015, type: 'Plumbing — Water Heater',    status: 'Final' },
      { year: 2010, type: 'HVAC — New System',          status: 'Final' },
    ],
  }

  return NextResponse.json(mockData)
}
