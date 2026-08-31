# 🛡️ Aegis: Agent-Native Disaster Response GIS

**Built for The WebMCP Challenge by OpenAI**

> *"Dispatch, the wind just shifted! The fire jumped Highway 101. Engine 4 and Engine 7 are trapped by the fire line! We need immediate evac for the Whispering Pines sector!"*

### The Problem: The UI Bottleneck in a Crisis
When a massive disaster strikes—a wildfire, a flood, or an earthquake—911 dispatch command centers descend into chaos. Human operators are bombarded with frantic, panicked radio calls. 

To respond to the radio call above using traditional GIS (Geographic Information Systems) software, a dispatcher must:
1. Manually search the map for Highway 101.
2. Click through a toolbar to find the polygon tool and draw a hazard zone.
3. Open a database table, search for Engine 4 and Engine 7, and change their statuses to "Code Red."
4. Open a completely separate broadcast application to draft an evacuation alert.

**This takes 2 to 3 minutes.** In a fast-moving wildfire, 3 minutes costs lives. Software interfaces have become a bottleneck to human survival.

### The Solution: An Agent-Native Co-Pilot
**Aegis** eliminates the UI bottleneck. It transforms the AI agent into a real-time digital co-pilot using the **WebMCP** standard. 

Instead of forcing the human to click through complex menus, the AI listens to the chaotic radio transcript. It instantly parses the unstructured panic, identifies the coordinates, maps the entities, and uses WebMCP tools to dynamically draft the exact changes into the dashboard.

All the human commander has to do is review the AI's proposed actions and click **Approve**. What used to take 3 minutes now takes 3 seconds.

---

### 🌐 Live Demo & Hosted URL
**[Test Aegis Live on Vercel: https://aegis-webmcp.vercel.app/](https://aegis-webmcp.vercel.app/)**


## 🌍 The Need of the Hour & Potential Impact
As climate change accelerates, natural disasters are becoming more frequent and unpredictable. Emergency response teams are experiencing unprecedented cognitive overload. 

Aegis proves that the future of enterprise software is not "point-and-click"—it is **"Intent-and-Approve."** 
By combining the semantic reasoning of Large Language Models with the deterministic, rock-solid physics of hard-coded map engines, Aegis provides a blueprint for next-generation, life-saving software.

---

## 🛠️ Technical Implementation (WebMCP Leverage)

Aegis was built to perfectly execute the WebMCP specification, ensuring zero hallucinations on the map.

1. **The WebMCP Polyfill:** We implemented the official `@mcp-b/webmcp-polyfill` to ensure robust compatibility with the ChatGPT Desktop app's internal browser architecture.
2. **Strict JSON Schemas:** The AI does not guess how to mutate the map. We expose 5 strict tools (`draft_hazard_zone`, `update_unit_status`, `draft_evacuation_alert`, `relocate_unit`, `deploy_unit`) requiring exact floats and strings.
3. **The Agent-Native Event Bridge:** To prevent race conditions and ensure UI safety, the WebMCP `execute` functions do not mutate the database directly. Instead, they fire `CustomEvents` into our React state, placing them in a **Pending Actions Queue**.
4. **Human-in-the-Loop Safety:** In high-stakes environments, AI cannot act alone. Aegis requires a human dispatcher to physically click "Approve" before the React state applies the WebMCP payloads to the Leaflet map engine.
5. **Kinetic UI:** When coordinates are updated via WebMCP, the CSS engine dynamically animates the DOM, causing the firetruck markers to physically drive across the map rather than teleporting.

### 💻 Code Snippet: Registering the Tools
```javascript
await document.modelContext.registerTool({
    name: 'draft_hazard_zone',
    description: 'Draft a new hazard zone on the map for human approval.',
    inputSchema: { 
        type: 'object', 
        properties: { 
            name: { type: 'string' }, 
            lat: { type: 'number' }, 
            lng: { type: 'number' }, 
            radius: { type: 'number' } 
        }, 
        required: ['name', 'lat', 'lng', 'radius'] 
    },
    async execute(input) { 
        // Fires across the Event Bridge to React State!
        window.dispatchEvent(new CustomEvent('aegis-agent-action', { detail: { type: 'HAZARD', data: input } })); 
        return { content: [{ type: 'text', text: `Drafted hazard zone.` }] }; 
    }
});
```

---

## 🚀 How to Test & Use Aegis

Judges, you can test Aegis directly using the **ChatGPT Desktop App**.

**1. Open the App**
Open the official ChatGPT Desktop application (Mac/Windows).

**2. Select the Correct Model**
*(Note: As per OpenAI documentation, GPT-5.6 Luna blocks WebMCP. Please ensure your dropdown is set to **GPT-5.6 Terra**, **GPT-5.6 Sol**).*

**3. Paste the Crisis Prompt**
Copy and paste this exact block of text into the ChatGPT app:

> Please visit this URL using your in-app browser: `https://aegis-webmcp.vercel.app`
> 
> You are acting as an AI assistant for my Aegis Disaster Response system. I am a human dispatcher. I just received the following frantic radio call:
> 
> *"Command, Battalion 2! The fire is spreading out of control. I need you to relocate Engine 4 to coordinate Lat: 34.030, Lng: -118.230 immediately! Also, we are calling in backup: please deploy a new unit called 'Dozer 1' with ID 'D1' at coordinate Lat: 34.040, Lng: -118.220. Finally, mark a hazard zone named 'Exit 14 Fire' at 34.062, -118.258 with a 600m radius!"*
> 
> Please use the WebMCP tools available on the webpage to execute the necessary actions to respond to this crisis.

**4. Watch the Magic**
* The AI will read the tools and draft the actions into the left sidebar.
* **Click "Approve"** on the actions in the Aegis UI.
* Watch Engine 4 physically drive across the map to its new location, watch Dozer 1 spawn into existence, and watch the hazard zone appear!

---

## 🎨 Tech Stack
* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS v4 (Neo-Brutalist / SaaS Hybrid Design)
* **Map Engine:** React-Leaflet (OpenStreetMap)
* **Agent Integration:** `@mcp-b/webmcp-polyfill` & WebMCP standard