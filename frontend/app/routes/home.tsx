import { useState, useEffect } from "react"

import type { Route } from "./+types/home"
import { conferencesReadConferences } from '~/client/sdk.gen';
import type { ConferencesPublic } from "~/client/types.gen";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ]
}


export default function Home() {
  const [conferences, setConferences] = useState<ConferencesPublic>();
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await conferencesReadConferences();
      setLoading(false)
      if (error) {
        console.error("Error fetching conferences:", error);
        return;
      }
      setConferences(data);
    }

    fetchData()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4">
      <h1 className="text-2xl font-bold mb-4">API Response</h1>

      {loading && <p>Loading data...</p>}

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
