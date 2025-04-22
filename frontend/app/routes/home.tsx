import { Link } from "react-router";
import type { Route } from "./+types/home"

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Scholark" },
    // { name: "description", content: "Welcome to React Router!" },
  ]
}


export default function Home() {
  return (
    <div>
      <h1>Welcome to Scholark!</h1>
    </div>
  )
}
