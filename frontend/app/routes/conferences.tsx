import { useState, useEffect } from "react"

import type { Route } from "./+types/home"
import { conferencesReadConferences } from '~/client/sdk.gen';
import type { ConferencesPublic } from "~/client/types.gen";

export default function Conferences() {
  const conferences: ConferencesPublic = {
    "data": [
      {
        "name": "Ukaren",
        "start_date": "2025-04-20",
        "end_date": "2025-04-20",
        "location": "string",
        "website_url": "string",
        "abstract_deadline": "2025-04-20T10:44:55.066000",
        "paper_deadline": "2025-04-20T10:44:55.066000",
        "id": "de85b09b-a98e-4922-ac9b-968e5af52db5"
      }
    ],
    "count": 1
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4">
      <h1 className="text-2xl font-bold mb-4">API Response</h1>


      {conferences && (
        <div className="w-full max-w-4xl overflow-auto">
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify(conferences, null, 2)}
          </pre>
        </div>
      )}

    </div>
  )
}
