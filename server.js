const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  collection,
  doc,
  setDoc,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} = require("firebase/firestore");

// config do usługi firebase
const firebaseConfig = {
  apiKey: "AIzaSyA5QlCIOkzb5DqZUHaM6O3o_YzbEJ-wbd8",
  authDomain: "projopchat.firebaseapp.com",
  projectId: "projopchat",
  storageBucket: "projopchat.appspot.com",
  messagingSenderId: "168379235210",
  appId: "1:168379235210:web:57bf2742afc27ee40da673",
};

// zainicjuj baze danych
const fireApp = initializeApp(firebaseConfig);
const db = getFirestore(fireApp);

// zainicjuj wszystkie żeczy potrzebne do zbudowania API
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

// ustaw "origin" na każdy aby móc połączyć się z API z m.in localhost
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

// Middleware to check if all required fields exist
const validateFields = (requiredFields) => {
  return (req, res, next) => {
    let missingFields = false;

    // Check if each required field is present in the request body
    for (let i = 0; i < requiredFields.length - 1; i++) {
      if (!req.body[requiredFields[i]]) {
        missingFields = true;
        break;
      }
    }

    // If there are missing fields, send a response with an error
    if (missingFields) {
      return res.status(400).json({ error: `missing_fields` });
    }

    // If all required fields are present, proceed to the next middleware
    next();
  };
};

// ustaw słuchacza na połączenie się protokołem websocket
io.on("connection", (socket) => {
  const room = socket.handshake.query.id;

  // przekierój gniazdo do pokoju podanego w url
  socket.join(room);

  // ustaw słuchacza na wydażenie "message"
  socket.on("message", async (mess) => {
    const messJson = JSON.parse(mess);

    const senderDoc = await getDoc(doc(db, "users", messJson.user));
    if (!senderDoc.exists()) return;

    // possible html injection but who cares
    const usrname =
      senderDoc.data().first_name + " " + senderDoc.data().last_name;

    messJson.user = usrname;

    // wyślij otrzymaną wiadomość do wszystkich użytkowników w pokojó poza wysyłającym
    io.to(room).emit("message", JSON.stringify(messJson));

    // dodaj wiadomość do bazy danych
    await addDoc(
      collection(doc(db, "rooms", room), "messages"),
      {
        body: messJson.body,
        timestamp: Date.now(),
        user: usrname,
      },
      { merge: true }
    );
  });
});

// ustaw ścieżke /room/make jako metoda POST
// uid powinno byc z ciasteczkami zapytania aleeeeeeee no
app.get("/user/:uid/room/:name/add/", async (req, res) => {
  const roomId = req.params.name;
  const uid = req.params.uid;

  // stwórz odniesienie do dokumentu firestore z nazwą pokoju pobraną z zapytania
  const docRef = doc(db, "rooms", roomId);
  const userRef = doc(db, "users", uid);

  // pobierz dokument firebase pokoju
  const docSnap = await getDoc(docRef);

  // sprawdź czy istnieje
  if (!docSnap.exists()) {
    await setDoc(docRef, {});
  }

  // sprawdz czy uzytkownik juz ma ten pokuj
  const check = await getDoc(userRef);

  if (!check.data().rooms.includes(roomId)) {
    await updateDoc(userRef, {
      rooms: arrayUnion(roomId),
    });
  }

  // wyślij odpowiedz z kodem 200 (OK)
  res.status(200).send();
});

app.get("/user/:uid/room/:name/delete/", async (req, res) => {
  const rName = req.params.name;

  await updateDoc(doc(db, "users", req.params.uid), {
    rooms: arrayRemove(rName),
  });

  const q = query(
    collection(db, "users"),
    where("rooms", "array-contains", rName)
  );

  const rooms = await getDocs(q);
  if (rooms.docs.length == 0) {
    await deleteDoc(doc(db, "rooms", rName));
  }

  res.status(200).send();
});

app.get("/user/:uid/rooms/get", async (req, res) => {
  const uid = req.params.uid;

  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) return res.status(401).send();

  res.status(200).json(userDoc.data().rooms);
});

// ustaw ścieżke jako metoda get z parametrem "id"
app.get("/room/:id/messages/get", async (req, res) => {
  const rId = req.params.id;

  // pobierz wiadomości z bazy danych
  const querySnapshot = await getDocs(
    query(
      collection(doc(db, "rooms", rId), "messages"),
      orderBy("timestamp", "asc")
    )
  );

  // jeśli ilość wiadomości = 0, zwróć odpowiedni kod i pusty obiekt
  if (querySnapshot.size == 0) {
    return res.status(204).json([]);
  }

  // przekonwertuj objekt zwrócony przez firebase na prostrzy
  let parsed = [];
  querySnapshot.forEach((doc) => {
    parsed.push(doc.data());
  });

  // wyślij spowrotem wiadomości z pokoju
  res.status(200).json(parsed);
});

app.post(
  "/accounts/register",
  validateFields(["email", "password", "fName", "lName"]),
  async (req, res) => {
    const accDocs = await getDocs(
      query(collection(db, "users"), where("email", "==", req.body.email))
    );

    if (accDocs.docs.length > 0) {
      return res.status(400).json({ error: "account_is" });
    }

    const added = await addDoc(collection(db, "users"), {
      email: req.body.email,
      password: req.body.password,
      first_name: req.body.fName,
      last_name: req.body.lName,
      rooms: [],
    });

    res.status(200).send(added.id);
  }
);

app.post(
  "/accounts/login",
  validateFields(["email", "password"]),
  async (req, res) => {
    const accDocs = await getDocs(
      query(collection(db, "users"), where("email", "==", req.body.email))
    );

    if (accDocs.docs.length == 0)
      return res.status(400).json({ error: "account_is_not" });
    else if (accDocs.docs[0].data().password != req.body.password)
      return res.status(400).json({ error: "invalid_password" });

    res.status(200).send(accDocs.docs[0].id);
  }
);

// słuchaj żądań na porcie ze zmiennej PORT. domyślnie 3000
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
