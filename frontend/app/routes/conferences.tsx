import { Card, CardHeader, CardTitle } from "~/components/ui/card"
import type { Route } from "./+types/conferences"
import { conferencesReadConferences } from '~/client/sdk.gen';
import type { ConferencePublic } from "~/client/types.gen";

export async function clientLoader({ }: Route.ClientLoaderArgs) {
  const { data, error } = await conferencesReadConferences();
  if (error) {
    throw new Response("Error fetching conferences", { status: 500 });
  }
  return { data };
}

export default function Conferences({
  loaderData,
}: Route.ComponentProps) {

  const { data: conferences } = loaderData;

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4">
      <h1 className="text-2xl font-bold mb-4">Conferences</h1>

      {conferences && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conferences.data.map((conference: ConferencePublic) => (
            <Card className="w-[300px]">
              <CardHeader>
                <CardTitle>{conference.name}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
