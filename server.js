const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
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

// ustaw słuchacza na połączenie się protokołem websocket
io.on("connection", (socket) => {
  const room = socket.handshake.query.id;

  // przekierój gniazdo do pokoju podanego w url
  socket.join(room);

  // ustaw słuchacza na wydażenie "message"
  socket.on("message", async (mess) => {
    const messJson = JSON.parse(mess);

    // wyślij otrzymaną wiadomość do wszystkich użytkowników w pokojó poza wysyłającym
    socket.to(room).emit("message", mess);

    // dodaj wiadomość do bazy danych
    await addDoc(
      collection(doc(db, "rooms", room), "messages"),
      {
        body: messJson.body,
        timestamp: Date.now(),
      },
      { merge: true }
    );
  });
});

// ustaw ścieżke /room/make jako metoda POST
app.post("/room/make", async (req, res) => {
  const roomId = req.body.name;

  // stwórz odniesienie do dokumentu firestore z nazwą pokoju pobraną z zapytania
  const docRef = doc(db, "rooms", roomId);

  // pobierz dokument firebase pokoju
  const docSnap = await getDoc(docRef);

  // sprawdź czy istnieje
  // jeśli tak to nic nie rób, bo użytkownik po prostu dołączy do istniejącego pokoju
  // jeśli nie to dodaj pokój do bazy danych
  if (!docSnap.exists()) await setDoc(docRef, {});

  // wyślij odpowiedz z kodem 200 (OK)
  res.status(200).send();
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
    res.status(400).json([]);
    return;
  }

  // przekonwertuj objekt zwrócony przez firebase na prostrzy
  let parsed = [];
  querySnapshot.forEach((doc) => {
    parsed.push(doc.data());
  });

  // wyślij spowrotem wiadomości z pokoju
  res.status(200).json(parsed);
});

// słuchaj żądań na porcie ze zmiennej PORT. domyślnie 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
