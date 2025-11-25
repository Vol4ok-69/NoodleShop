#!/bin/sh

# Проверяем наличие ВСЕХ необходимых переменных
if [ -z "$FIREBASE_API_KEY" ] || [ -z "$FIREBASE_AUTH_DOMAIN" ] || [ -z "$FIREBASE_DATABASE_URL" ] || 
   [ -z "$FIREBASE_PROJECT_ID" ] || [ -z "$FIREBASE_STORAGE_BUCKET" ] || 
   [ -z "$FIREBASE_MESSAGING_SENDER_ID" ] || [ -z "$FIREBASE_APP_ID" ]; then
  echo "Error: Missing Firebase environment variables"
  echo "Please check your .env file"
  exit 1
fi

cat > /usr/share/nginx/html/firebase-config.js << EOF
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
  apiKey: "$FIREBASE_API_KEY",
  authDomain: "$FIREBASE_AUTH_DOMAIN",
  databaseURL: "$FIREBASE_DATABASE_URL",
  projectId: "$FIREBASE_PROJECT_ID",
  storageBucket: "$FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "$FIREBASE_MESSAGING_SENDER_ID",
  appId: "$FIREBASE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, get, set, update, remove };
EOF

echo "Firebase config successfully injected with environment variables"