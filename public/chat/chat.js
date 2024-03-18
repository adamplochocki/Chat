// zimportój bibliotekę do ułatwienia obsługi protokołu websockets
import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
import { getUserId } from "../../utils/acc_client.js";

const uid = getUserId();
if (uid == "" || uid == undefined) {
  window.location.href = "../accounts/login.html";
}

// rozpocznij pobieranie wiadomości pokoju z bazy danych
getMessages();

// połącz się z serwerem websocket
const socket = io(`wss://chat-api-xi45.onrender.com?id=${roomId}`, {
  transports: ["websocket"],
});

// utwórz słuchacza dla wydarzenia "message" w websocket
socket.on("message", (mess) => {
  // wyświetl odebraną wiadomośc
  showMessage(JSON.parse(mess));
});

document.querySelector("input").onchange = sendMessage;

function sendMessage(e) {
  if (e.target.value == "" || e.target.value == undefined) return;

  const message = {
    body: e.target.value,
    user: uid,
  };

  // wyślij wiadomość do innych użytkowników w pokoju
  socket.send(JSON.stringify(message));

  e.target.value = "";
}

async function getMessages() {
  // wyślij żądanie do API
  const response = await fetch(
    `https://chat-api-xi45.onrender.com/room/${roomId}/messages/get`
  );

  // jeśli API odpowie kodem 400 to znaczy że niema waidomości więc kończymy życie funkcji
  if (response.status == 204) {
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

  messElement.innerHTML = `
    <span>${message.user}</span>
    <p>${message.body}</p>
  `;

  // wyświetl element wiadomości
  document.querySelector("#messages").appendChild(messElement);
}
