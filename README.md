# Scholark

**Scholark** is a minimalist, flexible SaaS tool that helps researchers and students manage their research schedules effectively.

## 🎯 Purpose

The goal of Scholark is to fill the gap between traditional calendar tools and academic workflow platforms by providing:

- A personalized timeline of upcoming conferences, submissions, and research goals
- Shared and community-curated conference information
- A lightweight system for managing academic milestones without the overhead of citation managers or networking platforms

## 🧰 Key Features

- 📅 **Conference Tracking**: Add and browse conference metadata (name, dates, abstract/paper deadlines, website, etc.)
- 🏷️ **Custom Labels**: Mark conferences with user-defined labels (e.g. “Interested”, “Attending”)
- 🧠 **Personal Notes**: Store private notes per conference (e.g. paper title, bibtex, GitHub links, misc info)
- 🧭 **Research Roadmap**: Define personal research topics and link them to planned conference submissions
- 🔁 **Real-Time Calendar Integration**: Subscribe to an always-up-to-date iCal feed for personalized scheduling
- 👥 **Community Sharing**: Share and discover conference info submitted by other users

---

## 🏗️ Technology Stack

### 🖥️ **Frontend**

- **React** — modern, component-based UI
- **Cloudflare Pages** — globally-distributed static hosting for frontend
- **shadcn/ui + Tailwind CSS** — minimalist, accessible component library and styling system

### 🧠 **Backend**

- **Cloudflare Workers** — serverless functions for handling API requests
- **Cloudflare D1** — lightweight, serverless SQL database (SQLite-based)
- **UUID-based IDs** — for globally unique entity references

### 🛠️ **Tooling**

- **Wrangler** — CLI for developing and deploying Cloudflare Workers and D1
- **TypeScript** — safe, modern language for both backend and frontend
- **GitHub** — source code + CI integration

---

## 🌐 Domain

- **<https://scholark.app>** — secured via Cloudflare with HTTPS and performance optimizations
