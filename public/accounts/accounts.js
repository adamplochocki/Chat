import { getUserId, hash } from "../../utils/acc_client.js";

if (getUserId().length > 0) {
  window.location.href = "../main/index.html";
}

Array.from(document.querySelectorAll("input")).forEach((element) => {
  element.style.width = (300 + parseInt(Math.random() * 200)).toString() + "px";
});

document.querySelector("#toggle").onclick = (e) => {
  const passwordInput = document.querySelector("#password");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";

  e.target.className = e.target.className == "hide" ? "show" : "hide";
};

const header = document.querySelector("h1");

document.querySelector("button").onclick = (e) => {
  header.classList.remove("toggle");

  if (e.target.id == "login") login();
  else if (e.target.id == "register") register();
};

async function login() {
  const payload = {
    email: document.querySelector("#email").value,
    password: await hash(document.querySelector("#password").value),
  };

  fetch("https://chat-api-xi45.onrender.com/accounts/login", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  }).then((resp) => {
    if (resp.status === 400) {
      header.classList.add("error");

      resp.json().then((err) => {
        if (err.error == "invalid_password")
          header.textContent = "Password is incorrect";
        else header.textContent = "Account doesn't exist";
      });
    } else {
      resp.text().then((uid) => {
        document.cookie = `uid=${uid}; path=/; SameSite=Lax;`;
        window.location.href = "../main/index.html";
      });
    }
  });
}

async function register() {
  const payload = {
    email: document.querySelector("#email").value,
    password: await hash(document.querySelector("#password").value),
    fName: document.querySelector("#fName").value,
    lName: document.querySelector("#lName").value,
  };

  fetch("https://chat-api-xi45.onrender.com/accounts/register", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  }).then((resp) => {
    if (resp.status === 400) {
      header.classList.add("error");
      header.textContent = "Account already exists";
    } else {
      return resp.text().then((uid) => {
        document.cookie = `uid=${uid}; path=/; SameSite=Lax;`;
        window.location.href = "../main/index.html";
      });
    }
  });
}
