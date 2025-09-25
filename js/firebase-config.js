import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  onValue,
  get,
  set,
  update,
  remove  
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDLTWyegwz7aDDN4XBOOuXzVlrf_w3C_-I",
  authDomain: "noodleshop-16fd2.firebaseapp.com",
  databaseURL: "https://noodleshop-16fd2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "noodleshop-16fd2",
  storageBucket: "noodleshop-16fd2.firebasestorage.app",
  messagingSenderId: "34190182490",
  appId: "1:34190182490:web:cbbb0ede7900a0694f3063"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, get, set, update, remove };