import ws from "k6/ws";
import { sleep } from "k6";
import { SharedArray } from "k6/data";

const sharedColors = new SharedArray("color palette", function () {
  return [
    "#000000",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
  ];
});

const canvas_scen = {
  executor: "ramping-vus",
  startVUs: 0,
  stages: [
    { duration: "3s", target: 50 },
    { duration: "5m", target: 499 },
    { duration: "2s", target: 20 },
    { duration: "2s", target: 0 },
  ],
  exec: "canvasTest",
};

const chatTestScene = {
  executor: "ramping-vus",
  startVUs: 0,
  stages: [
    { duration: "3s", target: 50 },
    { duration: "5s", target: 250 },
    { duration: "2s", target: 0 },
  ],
  exec: "chatTest",
};

export const options = {
  scenarios: {
    canvas_scen,
  },
};

export function canvasTest() {
  sleep(Math.random() * 2);
  const url = "ws://localhost:5000/socket.io/?EIO=4&transport=websocket";
  let roomID = null;

  ws.connect(url, {}, function (socket) {
    socket.on("open", () => {
      socket.send("40");
      socket.send('42["find-draw"]');
    });

    socket.on("message", (raw) => {
      if (raw === "2") {
        socket.send("3");
        return;
      }

      if (raw.startsWith("42")) {
        const parsed = JSON.parse(raw.substring(2));
        const event = parsed[0];
        const data = parsed[1];

        if (event === "room-found") {
          roomID = data.roomID;

          socket.setInterval(() => {
            const randomColor =
              sharedColors[Math.floor(Math.random() * sharedColors.length)];
            const randomSize = Math.floor(Math.random() * 40) + 1;
            const totalPoints = Math.floor(Math.random() * 6) + 2;
            const randomPath = [];

            for (let i = 0; i < totalPoints; i++) {
              randomPath.push({
                x: Math.floor(Math.random() * 800),
                y: Math.floor(Math.random() * 600),
              });
            }

            const drawingPayload = [
              "objectDrawn",
              {
                roomID: roomID,
                path: randomPath,
                color: randomColor,
                size: randomSize,
              },
            ];

            socket.send(`42${JSON.stringify(drawingPayload)}`);
          }, 1000);
        }
      }
    });

    socket.setTimeout(() => {
      socket.close();
    }, 200000);
  });

  sleep(1);
}

export function chatTest() {
  sleep(Math.random() * 2);
  const url = "ws://localhost:5000/socket.io/?EIO=4&transport=websocket";
  let roomID = null;

  ws.connect(url, {}, function (socket) {
    socket.on("open", () => {
      socket.send("40");
      socket.send('42["find-room"]');
    });

    socket.on("message", (raw) => {
      if (raw === "2") {
        socket.send("3");
        return;
      }

      if (raw.startsWith("42")) {
        const parsed = JSON.parse(raw.substring(2));
        const event = parsed[0];
        const data = parsed[1];

        if (event === "room-found") {
          roomID = data.roomID;

          socket.setInterval(() => {
            const chatPayload = [
              "message",
              {
                message: "hello",
                userName: "tester",
                roomID: roomID,
              },
            ];
            socket.send(`42${JSON.stringify(chatPayload)}`);
          }, 1000);
        }
      }
    });

    socket.setTimeout(() => {
      socket.close();
    }, 10000);
  });

  sleep(1);
}
