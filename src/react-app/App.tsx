// src/App.tsx

import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
import honoLogo from "./assets/hono.svg";
import "./App.css";

// Define the Conference type
interface Conference {
  id: string;
  name: string;
  start_date: string;
  paper_deadline: string;
  metadata: Record<string, any> | null;
}

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("unknown");
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch conferences
  const fetchConferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/conferences");
      const data = await response.json();
      if (data.success) {
        setConferences(data.conferences);
      } else {
        setError(data.error || "Failed to fetch conferences");
      }
    } catch (err) {
      setError("Error fetching conferences");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://hono.dev/" target="_blank">
          <img src={honoLogo} className="logo cloudflare" alt="Hono logo" />
        </a>
        <a href="https://workers.cloudflare.com/" target="_blank">
          <img
            src={cloudflareLogo}
            className="logo cloudflare"
            alt="Cloudflare logo"
          />
        </a>
      </div>
      <h1>Vite + React + Hono + Cloudflare</h1>
      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          aria-label="increment"
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="card">
        <button
          onClick={() => {
            fetch("/api/")
              .then((res) => res.json() as Promise<{ name: string }>)
              .then((data) => setName(data.name));
          }}
          aria-label="get name"
        >
          Name from API is: {name}
        </button>
        <p>
          Edit <code>worker/index.ts</code> to change the name
        </p>
      </div>
      <div className="card">
        <h2>Conferences</h2>
        <button onClick={fetchConferences} disabled={loading}>
          {loading ? "Loading..." : "Fetch Conferences"}
        </button>
        {error && <p className="error">{error}</p>}
        {conferences.length > 0 ? (
          <div className="conferences-list">
            {conferences.map((conf) => (
              <div key={conf.id} className="conference-item">
                <h3>{conf.name}</h3>
                <p>Start Date: {conf.start_date}</p>
                <p>Paper Deadline: {conf.paper_deadline}</p>
                {conf.metadata && (
                  <div className="metadata">
                    <h4>Metadata:</h4>
                    {Object.entries(conf.metadata).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}:</strong>{" "}
                        {typeof value === "string" && value.startsWith("http") ? (
                          <a href={value} target="_blank" rel="noopener noreferrer">
                            {value}
                          </a>
                        ) : (
                          JSON.stringify(value)
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No conferences found. Click the button to fetch conferences.</p>
        )}
      </div>
      <p className="read-the-docs">Click on the logos to learn more</p>
    </>
  );
}

export default App;
