import ws from "k6/ws";
import { sleep } from "k6";

export const options = {
  vus: 500,
  duration: "10s",
};

export default function () {
  const url = "ws://localhost:5000/socket.io/?EIO=4&transport=websocket";

  let roomID = null;

  ws.connect(url, {}, function (socket) {
    socket.on("open", () => {
      console.log(`VU ${__VU} connected`);

      socket.send("40");

      socket.send('42["find-room"]');
    });

    socket.on("message", (raw) => {
      console.log(`VU ${__VU} RAW:`, raw);

      if (raw === "2") {
        socket.send("3");
        return;
      }

      if (raw.startsWith("42")) {
        const parsed = JSON.parse(raw.substring(2));

        const event = parsed[0];
        const data = parsed[1];

        console.log("EVENT:", event);

        if (event === "room-found") {
          roomID = data.roomID;

          console.log(`VU ${__VU} joined room ${roomID}`);

          socket.setInterval(() => {
            socket.send(
              `42["message",${JSON.stringify({
                message: `hello from ${__VU}`,
                userName: `user-${__VU}`,
                roomID,
              })}]`,
            );
          }, 1000);
        }

        if (event === "message") {
          console.log(`VU ${__VU} received:`, JSON.stringify(data));
        }
      }
    });

    socket.on("close", () => {
      console.log(`VU ${__VU} disconnected`);
    });

    socket.setTimeout(() => {
      socket.close();
    }, 10000);
  });

  sleep(1);
}
