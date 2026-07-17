/**
 * Tank Filling — standalone live dashboard server
 *
 * One script does two jobs:
 *   1. Connects to WinCC's OPC UA server and watches your tags.
 *   2. Serves a simple web page, pushing live updates to any browser
 *      that has it open (using Server-Sent Events — a lightweight,
 *      one-way "live updates" channel built into every browser,
 *      no extra libraries needed on the frontend).
 *
 * Setup:
 *   npm install express node-opcua-client
 *
 * Run:
 *   node server.js
 *
 * Then open:
 *   http://localhost:3000
 */

const express = require("express");
const path = require("path");
const {
  OPCUAClient,
  AttributeIds,
  TimestampsToReturn,
  MessageSecurityMode,
  SecurityPolicy,
} = require("node-opcua-client");

const app = express();
const PORT = 3000;

// Serve index.html and any assets from the "public" folder.
app.use(express.static(path.join(__dirname, "public")));

// Every connected browser tab gets its own "response" object kept open
// here, so we can push new data to all of them whenever a tag changes.
let clients = [];

// Server-Sent Events endpoint — the browser connects here and keeps
// the connection open to receive live updates.
app.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  clients.push(res);
  console.log(`Browser connected. Total connected: ${clients.length}`);

  // Send whatever we currently know immediately, so the page isn't
  // blank while waiting for the next change.
  res.write(`data: ${JSON.stringify(liveValues)}\n\n`);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
    console.log(`Browser disconnected. Total connected: ${clients.length}`);
  });
});

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => res.write(payload));
}

// ---- OPC UA setup ----
// Your actual WinCC OPC UA server endpoint (from UAExpert).
const endpointUrl = "opc.tcp://makkiawouda:4870";

// Copy the exact Node Id for each tag from UAExpert (click the tag,
// check its "Node Id" attribute — yours will look like "ns=3;s=pv_actual").
const nodesToMonitor = {
  pv_actual: "ns=3;s=pv_actual",
  pot_setpoint: "ns=3;s=pot_setpoint",
  fill_valve: "ns=3;s=fill_valve",
  discharge_valve: "ns=3;s=discharge_valve",
  start: "ns=3;s=start",
  stop: "ns=3;s=stop",
  reset: "ns=3;s=reset",
};

const liveValues = {};

async function startOpcUa() {
  const client = OPCUAClient.create({
    endpointMustExist: false,
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
    automaticallyAcceptUnknownCertificate: true,
    connectionStrategy: {
      maxRetry: 3,
      initialDelay: 1000,
      maxDelay: 5000,
    },
  });

  console.log(`Connecting to ${endpointUrl} ...`);
  console.log("(first run may take ~15s to create a certificate — this is normal)");
  await client.connect(endpointUrl);
  console.log("Connected to OPC UA server.");

  const session = await client.createSession(); // anonymous
  const subscription = await session.createSubscription2({
    requestedPublishingInterval: 500,
    requestedLifetimeCount: 1000,
    requestedMaxKeepAliveCount: 20,
    maxNotificationsPerPublish: 50,
    publishingEnabled: true,
    priority: 10,
  });

  for (const [tagName, nodeId] of Object.entries(nodesToMonitor)) {
    const monitoredItem = await subscription.monitor(
      { nodeId, attributeId: AttributeIds.Value },
      { samplingInterval: 250, discardOldest: true, queueSize: 10 },
      TimestampsToReturn.Both
    );

    monitoredItem.on("changed", (dataValue) => {
      liveValues[tagName] = dataValue.value.value;
      liveValues.updatedAt = new Date().toLocaleTimeString();
      broadcast(liveValues);
      console.log(`[${tagName}] -> ${dataValue.value.value}`);
    });
  }

  console.log("Watching tags.");
}

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});

startOpcUa().catch((err) => {
  console.error("Failed to connect to OPC UA server:", err.message);
  console.error("Is WinCC Runtime actually running?");
});