import { getUserId } from "../../utils/acc_client.js";

const uid = getUserId();
if (uid == "" || uid == undefined) {
  window.location.href = "../accounts/login.html";
}

// jeśli użytkownik kliknie przycisk dodania nowego pokoju to przekieruj go do strony dodania pokoju
document.querySelector("button").onclick = () => {
  window.location.href = "../add/add.html";
};

// TODO : pobierz pokoje użytkownika i jeśli są jakie, to je wyświetl
fetch(`https://shoppinglist-lb7q.onrender.com/user/${uid}/rooms/get`)
  .then((r) => {
    if (r.status === 401) window.location.href = "../accounts/login.html";
    return r.json();
  })
  .then((rooms) => showRooms(rooms));

function showRooms(chats) {
  console.log(chats);
  chats.forEach((room) => {
    const roomElement = document.createElement("div");
    roomElement.classList.add("room");

    roomElement.innerHTML = `
        <p>${room}</p>
        <span></span>
      `;
    roomElement.dataset.id = room;
    roomElement.querySelector("span").onclick = removeRoom;

    // jeśli użytkownik kliknie na nazwe pokoju to przekieruj go do strony tego pokoju
    roomElement.onclick = (e) => {
      if (e.target.nodeName == "SPAN") return;

      window.location.href = "../chat/chat.html?id=" + roomElement.dataset.id;
    };

    document.querySelector("#rooms").appendChild(roomElement);
  });
}

function removeRoom(e) {
  const removeId = e.target.parentNode.dataset.id;

  fetch(
    `https://shoppinglist-lb7q.onrender.com/user/${uid}/room/${removeId}/delete`
  );

  e.target.parentNode.remove();
}
