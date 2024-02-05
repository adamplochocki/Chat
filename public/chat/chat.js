// zaimportój bibliotekę do ułatwienia obsługi protokołu websockets
import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

// rozpocznij pobieranie wiadomości pokoju z bazy danych
getMessages();

// połącz się z serwerem websocket
const socket = io("ws://localhost:3000?id=" + roomId);

// utwórz słuchacza dla wydarzenia "message" w websocket
socket.on("message", (mess) => {
  // wyświetl odebraną wiadomośc
  showMessage(JSON.parse(mess));
});

document.querySelector("input").onchange = sendMessage;

function sendMessage(e) {
  const message = {
    body: e.target.value,
  };

  // wyślij wiadomość do innych użytkowników w pokoju
  socket.send(JSON.stringify(message));

  // pokaż wiadomość którą wysłał użytkownik
  showMessage(message);
}

async function getMessages() {
  // wyślij żądanie do API
  const response = await fetch(
    `http://localhost:3000/room/${roomId}/messages/get`
  );

  // jeśli API odpowie kodem 400 to znaczy że niema waidomości więc kończymy życie funkcji
  if (response.status == 400) {
    return;
  }

  let rooms = await response.json();

  if (rooms == undefined) return;

  // dla każdej wiadomości otrzymanej od API, wyświetl ją
  rooms.forEach((mess) => {
    showMessage(mess);
  });
}

function showMessage(message) {
  const messElement = document.createElement("div");
  messElement.classList.add("message");

  messElement.innerHTML = `<p>${message.body}</p>`;

  // wyświetl element wiadomości
  document.querySelector("#messages").appendChild(messElement);
}
