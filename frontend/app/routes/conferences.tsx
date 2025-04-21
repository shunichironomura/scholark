import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "~/components/ui/card"
import type { Route } from "./+types/home"
import { conferencesReadConferences } from '~/client/sdk.gen';
import type { ConferencesPublic, ConferencePublic } from "~/client/types.gen";

export default function Conferences() {
  const [conferences, setConferences] = useState<ConferencesPublic>();
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4">
      <h1 className="text-2xl font-bold mb-4">Conferences</h1>

      {conferences && (
        <div>
          {conferences.data.map((conference: ConferencePublic) => (
            <div>
              {JSON.stringify(conference, null, 2)}
            </div>
          ))}
        </div>
      )}




    </div>
  );
}
