async function hash(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

function getUserId() {
  const uid = document.cookie
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, v) => {
      if (v[0] == "uid") {
        acc = v[1];
      }
      return acc;
    }, "");

  if (uid == "" || uid == undefined) {
    return "";
  } else {
    return uid;
  }
}

export { getUserId, hash };
