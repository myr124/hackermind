> **Phase 1 scope:** See [the refined Phase 1 specification](docs/phase-1-spec.md) for the current build requirements. The broader examples, architecture, and data models below describe the product vision and are illustrative where they differ from that specification. Phases 2–3 remain future vision.

> **Discover what people are building — and what should be built next.**

## Overview

A developer-focused project discovery and inspiration platform that helps builders explore **interesting projects, emerging technologies, trending problem spaces, and new project opportunities**.

The platform acts as a **Pinterest-style inspiration board for developers**, aggregating projects and signals from sources such as GitHub, Product Hunt, and other developer communities.

Instead of simply generating project ideas with an LLM, the platform uses **real projects and ecosystem activity** to help users answer:

- What are people building right now?
    
- What problem spaces are becoming popular?
    
- What technologies are gaining momentum?
    
- What interesting projects exist within a space?
    
- What related areas should I explore?
    
- What combinations of technologies are emerging?
    
- Where might there be unexplored opportunities?
    
- What should I build next?
    

---

# Core Concept

Most existing platforms organize discovery around a specific type of content:

|Platform|Primary Unit|
|---|---|
|GitHub|Repository|
|Devpost|Hackathon Project|
|Product Hunt|Product|
|Peerlist|Developer / Project|
|Pinterest|Visual Inspiration|
|**This Platform**|**Problem Space / Project Idea**|

The goal is to create an **intelligence layer over the developer ecosystem**.

Rather than showing users a collection of repositories, the platform analyzes projects and organizes them into meaningful problem spaces.

For example:

```text
Computer Vision
      │
      ├── Pose Estimation
      │
      ├── Visual Navigation
      │
      ├── Virtual Try-On
      │
      └── Gesture Recognition
      │
      ↓
Fashion Technology
      │
      ├── AI Stylist
      ├── Smart Mirror
      ├── Wardrobe Management
      └── AR Shopping
```

Users can navigate this graph to discover increasingly specific ideas.

---

# Product Experience

## 1. Discover

The homepage acts as a constantly changing feed of interesting areas.

```text
🔥 Trending Problem Spaces

AI Agents                  ↑ 41%
Edge / Local AI            ↑ 32%
Robotics + Vision          ↑ 24%
Spatial Computing          ↑ 21%
AI Wearables               ↑ 18%
Developer Tools            ↑ 14%
```

Additional sections could include:

- 🔥 Trending
    
- 🚀 Rising
    
- 🌱 Emerging
    
- 🆕 New
    
- 💎 Underrated
    
- 🧪 Experimental
    
- 🏆 Popular Projects
    
- 👀 Projects You Might Like
    

---

# 2. Problem Spaces

Problem spaces are the central organizational unit of the platform.

Example:

## Edge AI

**Momentum:** 🔥 Rapidly Rising  
**Related Projects:** 382  
**Growth:** +32%

### Popular Technologies

- NVIDIA Jetson
    
- ONNX
    
- TensorRT
    
- Ollama
    
- Small Language Models
    
- Computer Vision
    
- Vision-Language Models
    

### Common Applications

- Local AI assistants
    
- Robotics
    
- Smart cameras
    
- Wearables
    
- Smart-home devices
    
- Privacy-preserving AI
    

### Related Spaces

- Robotics
    
- Computer Vision
    
- Embedded Systems
    
- Personal AI
    
- Wearable Computing
    

### Emerging Intersections

```text
Edge AI
   │
   ├── + Robotics
   │      └── Autonomous systems
   │
   ├── + Fashion
   │      └── Smart mirrors
   │
   ├── + Wearables
   │      └── AI glasses
   │
   └── + Healthcare
          └── Local patient monitoring
```

---

# 3. Project Discovery

Projects are aggregated from multiple sources and normalized into a common format.

Potential sources:

- GitHub
    
- Product Hunt
    
- Hackathon platforms where authorized
    
- Research repositories
    
- Developer communities
    

Each project card could contain:

```text
┌─────────────────────────────────┐
│                                 │
│          Project Image          │
│                                 │
├─────────────────────────────────┤
│ SmartFit Mirror                 │
│                                 │
│ AI-powered virtual wardrobe     │
│ using real-time pose tracking.  │
│                                 │
│ Computer Vision • Edge AI       │
│ Fashion • AR                    │
│                                 │
│ GitHub ★ 2.4k                   │
│                                 │
│ ♡ Save                 Explore →│
└─────────────────────────────────┘
```

---

# 4. Inspiration Boards

Users can save projects, technologies, and problem spaces into personal boards.

Example boards:

```text
📌 Hackathon Ideas

📌 Jetson Projects

📌 Robotics Ideas

📌 AI + Hardware

📌 Things I Want To Build

📌 Weird Ideas

📌 Senior Design Ideas
```

Boards become personalized signals for future recommendations.

If a user frequently saves:

```text
Smart Mirrors
Pose Estimation
Jetson Projects
AR Interfaces
Wearable AI
```

the recommendation system could begin suggesting:

```text
Computer Vision + Fashion

Edge AI + AR

Gesture Interfaces

AI Wearables

Spatial Computing
```

---

# 5. Search

Search should support both traditional keywords and natural-language exploration.

Examples:

```text
"robotics projects using computer vision"

"interesting Jetson projects"

"AI projects that interact with the physical world"

"projects involving fashion and computer vision"

"weird uses of local AI"

"projects I could build during a 36-hour hackathon"
```

Semantic search retrieves projects based on **meaning**, rather than requiring exact keyword matches.

---

# 6. Idea Explorer

The Idea Explorer allows users to combine interests.

Example:

```text
Computer Vision
       +
Fashion
       +
Edge AI
```

The system analyzes the existing project landscape.

```text
COMPUTER VISION × FASHION × EDGE AI

Existing Project Clusters
────────────────────────────

Virtual Try-On                 84 projects
AI Outfit Recommendation      63 projects
Wardrobe Digitization         41 projects
Smart Mirrors                 27 projects
AR Shopping                   19 projects
```

It could then identify emerging or less-explored intersections.

```text
Potential Opportunities

→ Local/private virtual try-on

→ Real-time clothing augmentation

→ Smart mirrors using edge inference

→ Gesture-controlled wardrobe interfaces

→ Personalized styling without cloud processing
```

---

# 7. Trend Detection

The platform continuously measures activity around technologies and problem spaces.

Possible signals include:

- Number of new projects
    
- Repository creation
    
- GitHub star velocity
    
- Product engagement
    
- Project saves
    
- Search frequency
    
- Technology mentions
    
- Cluster growth
    
- Recency
    
- Cross-category growth
    

Example trend calculation:

```text
Trend Score =

Project Growth
+ Engagement Velocity
+ New Repository Growth
+ Search Interest
+ Cluster Growth
+ Recency Weight
```

This could generate dashboards such as:

```text
AI Coding Agents

Trend Score
████████████████████  94

Local / Edge AI
█████████████████     84

AI Wearables
███████████████       76

Spatial Computing
████████████          64

NFT Marketplaces
████                  21
```

---

# 8. AI Classification Pipeline

Projects from different sources are converted into a common representation.

Raw project:

```text
MirrorAI is an edge-computing smart mirror
that uses pose estimation and generative
models to visualize clothing.
```

AI-generated metadata:

```json
{
  "problem_spaces": [
    "fashion technology",
    "augmented reality",
    "personal AI"
  ],

  "technologies": [
    "computer vision",
    "pose estimation",
    "generative AI",
    "edge computing"
  ],

  "form_factor": "smart mirror",

  "target_user": "consumer",

  "problems": [
    "outfit visualization",
    "personalized styling"
  ]
}
```

This metadata powers:

- Search
    
- Recommendations
    
- Trend detection
    
- Project clustering
    
- Related projects
    
- Problem-space discovery
    
- Opportunity detection
    

---

# 9. Semantic Project Graph

Projects can be represented as a graph.

```text
                    Computer Vision
                          │
               ┌──────────┴──────────┐
               │                     │
        Pose Estimation          Object Detection
               │
               │
           Smart Mirror
               │
       ┌───────┴────────┐
       │                │
    Fashion          Edge AI
       │                │
 Virtual Try-On      Jetson
```

Graph relationships could connect:

```text
Project
Technology
Problem Space
Industry
Hardware
Developer
Repository
Hackathon
Research Paper
```

This enables exploratory browsing rather than traditional search.

---

# Architecture

```text
                    DATA SOURCES

       GitHub      Product Hunt      Submissions
          │             │                │
          └─────────────┼────────────────┘
                        │
                        ▼
                Ingestion Workers
                        │
                        ▼
                 Normalization
                        │
                        ▼
                AI Classification
                        │
              ┌─────────┴─────────┐
              │                   │
         Embeddings           Metadata
              │                   │
              └─────────┬─────────┘
                        ▼
                  PostgreSQL
                   + pgvector
                        │
             ┌──────────┼───────────┐
             │          │           │
           Search    Trends    Recommendations
             │          │           │
             └──────────┼───────────┘
                        ▼
                    FastAPI
                        │
                        ▼
                    Next.js
```

---

# Proposed Tech Stack

## Design System

Hacker-themed Signal design with readable monospace typography and small ASCII accents, while maintaining accessibility, ease of use, and readability.

Default to near-black surfaces, cool neutral text, warm-yellow primary accents, and cyan secondary accents, with an accessible light theme available. Use small ASCII accents in the wordmark and empty states. Keep controls conventional, keyboard focus visible, and meaning understandable without color alone.

The graph uses a circular constellation of broad problem spaces, specific subcategories, and projects, with explicit relationships and increasing detail prominence on zoom. Complementary Problem Spaces and Recently Added views preserve exploration state on desktop and mobile. Detailed behavior and acceptance scenarios are recorded in the [Phase 1 specification](docs/phase-1-spec.md).

## Frontend

Use Sigma.js with Graphology for the discovery graph; see the [Phase 1 implementation boundaries](docs/phase-1-spec.md#implementation-boundaries).

- Next.js
    
- TypeScript
    
- Tailwind CSS
    
- shadcn/ui
    

## Backend

- Python
    
- FastAPI
    

## Database

- PostgreSQL
    
- pgvector
    

## AI / ML

- LLM-based metadata extraction
    
- Text embeddings
    
- Semantic search
    
- Clustering
    
- Recommendation algorithms
    

Potential future techniques:

- HDBSCAN clustering
    
- Topic modeling
    
- Graph embeddings
    
- Collaborative filtering
    
- Content-based recommendation
    
- Time-series trend detection
    

## Infrastructure

Potential options:

- Vercel
    
- Supabase
    
- Railway
    
- AWS / GCP
    
- Background ingestion workers
    
- Scheduled data pipelines
    

---

# Data Model

## Project

```ts
interface Project {
  id: string

  name: string
  description: string
  image?: string

  source: string
  sourceUrl: string

  technologies: string[]
  problemSpaces: string[]
  industries: string[]

  stars?: number
  engagement?: number

  createdAt?: Date
  discoveredAt: Date

  embedding: number[]
}
```

## ProblemSpace

```ts
interface ProblemSpace {
  id: string

  name: string
  description: string

  projectCount: number

  trendScore: number
  growthRate: number

  relatedSpaces: string[]
  technologies: string[]

  embedding: number[]
}
```

## Board

```ts
interface Board {
  id: string
  userId: string

  name: string
  description?: string

  projects: string[]
  problemSpaces: string[]
}
```

---

# MVP

The initial version should focus on **discovery**, not trying to build the entire intelligence system immediately.

## Phase 1

The first milestone is a locally runnable discovery experience for developers seeking side-project inspiration. Its complete requirements and acceptance scenarios are in [Phase 1 — Dynamic project discovery](docs/phase-1-spec.md).

- Ingest projects from GitHub, Show HN, itch.io, Hugging Face Spaces, and Product Hunt.
- Derive domains and broad, need-based problem spaces dynamically from projects, with more specific spaces underneath and inclusive, evidence-based matching criteria.
- Lead with an interactive node graph whose prominence reflects distinct catalog projects published in the last 90 days.
- Use a circular graph with explicit subcategory and project-membership links, stronger parent-space prominence, and zoom-based detail rather than taxonomy collapse. Suggested connections are optional and off by default.
- Explore project cards through complementary Problem Spaces and Recently Added views, and semantic search with filters.
- Inspect project details and save inspiration to private boards after signing in.
- Preserve source provenance, deduplicate explicit cross-source identities, and show partial coverage honestly.

See [CONTEXT.md](CONTEXT.md) for terminology and [the refinement record](docs/phase-1-refinement.md) for accepted interview decisions.

---

# Phase 2 — Intelligence

Add:

- Trending problem spaces
    
- Trend scores
    
- Emerging technologies
    
- Project clustering
    
- Personalized recommendations
    
- Related-space discovery
    
- Technology intersections
    

---

# Phase 3 — Idea Intelligence

Add:

- Idea Explorer
    
- Opportunity-gap detection
    
- Project similarity analysis
    
- "What's missing?" analysis
    
- Personalized project recommendations
    
- Hackathon-specific recommendations
    

Example:

```text
I know:

Python
React
Computer Vision
ROS2

I have:

Jetson Orin Nano
Camera
Arduino

Time:

36 hours

Interests:

Fashion
AR
Robotics
```

The platform could recommend project spaces grounded in **real projects and current trends** rather than generating ideas without context.

---

# Long-Term Vision

The platform becomes a map of the builder ecosystem.

Instead of asking:

> "Give me 10 AI project ideas."

A developer could explore:

```text
AI
 ↓
Edge AI
 ↓
Computer Vision
 ↓
Physical Interfaces
 ↓
Smart Displays
 ↓
Fashion
```

At every step they see:

- Real projects
    
- Technologies
    
- Repositories
    
- Trends
    
- Related spaces
    
- Emerging intersections
    
- Potential opportunities
    

The goal is not simply to **generate ideas**.

The goal is to help developers **discover ideas themselves**.

---

# Positioning

### Short

> **Pinterest for developers and builders.**

### Product

> **Discover what people are building — and what should be built next.**

### Technical

> **A project discovery engine that maps projects, technologies, and emerging problem spaces across the developer ecosystem.**

---

# Key Differentiator

The primary value is **not owning the largest project database**.

Platforms such as GitHub, Devpost, and Product Hunt already contain enormous amounts of project information.

The value is the intelligence layer built on top:

```text
Raw Projects
      ↓
Classification
      ↓
Semantic Relationships
      ↓
Problem Spaces
      ↓
Trend Detection
      ↓
Opportunity Discovery
      ↓
Personalized Inspiration
```

**The dataset tells you what exists.**

**The intelligence layer helps you figure out what to build next.**
