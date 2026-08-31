# 🛡️ Aegis: Agent-Native Disaster Response GIS

**Built for The WebMCP Challenge by OpenAI**

Aegis is a human-in-the-loop, WebMCP-powered emergency dispatch system. It transforms chaotic, real-time crisis data (like frantic radio transcripts) into precise, deterministic map states using an AI Agent—while ensuring human commanders retain ultimate authority over life-and-death decisions.

## 🌟 Why WebMCP?
Traditional GIS (Geographic Information Systems) are incredibly complex and slow to navigate during an active crisis. Without WebMCP, an AI agent would have to clumsily scrape the DOM or guess how to interact with a complex map canvas. 

By implementing the WebMCP open standard, Aegis exposes its internal React state and Leaflet map engine directly to the AI as structured tools. The agent orchestrates the semantic reasoning, while our deterministic UI handles the geospatial rendering. 

## 🤝 The Human-in-the-Loop Architecture
Aegis does not allow the LLM to mutate the production map blindly. We utilize a strict **Agent-Native Event Bridge**. 
1. The Agent calls a WebMCP tool (e.g., `draft_hazard_zone`).
2. The tool fires a `CustomEvent` to the React UI.
3. The UI presents the proposed action in the "Pending Actions" queue.
4. The human dispatcher visually verifies the coordinates and clicks **Approve**, shifting the state to the live Mapbox canvas.

## 🛠️ WebMCP Implementation
We implemented the official WebMCP specification using the `@mcp-b/webmcp-polyfill` to ensure compatibility across Chrome's native DevTools and ChatGPT's in-app browsers. 

Here is how we expose our tools to the agent:
```javascript
await document.modelContext.registerTool({
  name: "draft_hazard_zone",
  description: "Draft a new hazard zone on the map for human approval.",
  inputSchema: { 
    type: "object", 
    properties: { 
      name: { type: "string" }, 
      lat: { type: "number" }, 
      lng: { type: "number" }, 
      radius: { type: "number" } 
    }, 
    required: ["name", "lat", "lng", "radius"] 
  },
  execute: async (input) => {
    window.dispatchEvent(new CustomEvent('aegis-agent-action', { 
      detail: { type: 'HAZARD', data: input } 
    }));
    return { content: [{ type: 'text', text: "Drafted hazard zone." }] };
  }
});