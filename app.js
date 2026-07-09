const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { get } = require('http');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('base64');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Read word data history from the JSON file
let wordsData = [];
try {
  const data = fs.readFileSync('words.json', 'utf-8');
  wordsData = JSON.parse(data);
} catch (error) {
  console.error('Error reading JSON file:', error.message);
}




// dictionary
let wordsDataDict = [];
let usersDict = [];

try {
  const data = fs.readFileSync('output.json', 'utf-8');
  wordsDataDict = JSON.parse(data);
} catch (error) {
  console.error('Error reading JSON file:', error.message);
}
try {
  const data = fs.readFileSync('users.json', 'utf-8');
  usersDict = JSON.parse(data);
  // console.log("usersDict",usersDict);
}catch (error) {
  console.error('Error reading JSON file:', error.message)};


// sessions storage
let sessions = [];
try {
  const data = fs.readFileSync('sessions.json', 'utf-8');
  sessions = JSON.parse(data);
}catch (error) {
  console.error('Error reading JSON file:', error.message)}


function addToSessions(session){
  sessions.push(session);
  // Update the JSON file with the new data
  try {
    fs.writeFileSync('sessions.json', JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error writing to JSON file:', error.message);
  }
}

// request for history of words 
app.get('/api/words', (req, res) => {
  cookie=req.headers.csession;
  res.json(getHistory(getUserIdfromCookie(cookie)));
});

// new word adding to the words data file which is history of words
app.post('/api/words', (req, res) => {
  const { word, meaning, meaningG, cookie} = req.body;
  if (!word) {
    return res.status(400).send( 'Enter a word.' );
  }
  if (!cookie){
    return res.status(400).send('User not logged in. LogIn first to add words' );
  }


  const newWord = {
    id: wordsData.length + 1,
    userid: getUserIdfromCookie(cookie),
    word: word,
    meaningG: meaningG,
    meaning: meaning
  };

  wordsData.push(newWord);

  // Update the JSON file with the new data
  try {
    fs.writeFileSync('words.json', JSON.stringify(wordsData, null, 2));
  } catch (error) {
    console.error('Error writing to JSON file:', error.message);
  }

  res.json(newWord);
});
// api for dynamic search results
app.get('/api/dictionary/:word', (req, res) => {
  const { word } = req.params;

  const matchedWord = wordsDataDict.find((entry) => entry.word === word);
  if (matchedWord) {
    res.json({ meaningG: matchedWord.meaning}); 
  } else {
    res.status(404).json({ error: 'Word not found in dictionary.' });
  }
});

// api for login handling 
app.post("/api/login",(req,res)=>{
  // console.log("req",req.body);
  const {username,password}=req.body;

//  console.log("username",username);
//  console.log("password",password);
  // check for username and password in the usersDict
  var matchedUser = usersDict.find((entry) => entry.username == username);
  // console.log("matchedUser",matchedUser)
  // matchedUser={username:"admin",password:"admin"}
  if (matchedUser) {
    // console.log("matchedUser",matchedUser);
    if (matchedUser.password === sha256(password)) {
      // console.log("matchedUser",matchedUser)
      token=Math.floor(Math.random() * 1000000000000000);
      res.json({ success: true, token:token });
      addToSessions({userid:matchedUser.userid,token:token});
    } else {
      res.json({ success: false });
    }
  } else {
    res.json({ success: false });
  }
});


app.post("/api/register",(req,res)=>{
  // console.log("req",req.body);
  const {username,password,email}=req.body;

//  console.log("username",username);
//  console.log("password",password);

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  }
 
  // check for username and password in the usersDict0.
  var matchedUser = usersDict.find((entry) => entry.username == username);
  var matchedEmail = usersDict.find((entry) => entry.email == email);

  if (matchedUser) {
    // console.log("matchedUser",matchedUser);
    res.status(409).json({ success: false, message: 'Username already exists.' });
  } else if (matchedEmail) {
    res.status(409).json({ success: false, message: 'Email already exists.' });
  } else {
    const newUser = {
      userid: usersDict.length + 1,
      username: username,
      email: email,
      password: sha256(password)
    };

    usersDict.push(newUser);
    // Update the JSON file with the new data
    try {
      fs.writeFileSync('users.json', JSON.stringify(usersDict, null, 2));
    } catch (error) {
      console.error('Error writing to JSON file:', error.message);
    }
    token=Math.floor(Math.random() * 1000000000000000);
      res.json({ success: true, token:token });
      addToSessions({userid:newUser.userid,token:token});


  }
  
});

// Function to calculate the day of the year
function getDayOfYear(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};



// function for finding userid from the cookie 
function getUserIdfromCookie(cookie){
  // console.log("cookie",cookie);
  if(cookie){
    matchedcookie= sessions.find((entry) => entry.token == cookie);
    if (matchedcookie){
      return matchedcookie.userid;
    }
  }
  else{
    return null;
  }
};
// function for getting history from the userid
function getHistory(userid){
  const matchedHistory = wordsData.filter((entry) => entry.userid == userid);
  if (matchedHistory) {
    // console.log("matchedHistory",matchedHistory);
    return matchedHistory;

  } else {
    return [];
  }
}


//  handle /logout
// app.get("/logout",(req,res)=>{
//   cookie=req.headers.cookie.slice(6, );
//   console.log("cookie",cookie.slice(6, ));
//   // console.log("cookie",cookie);
//   matchedcookie= sessions.find((entry) => entry.token == cookie);
//   if (matchedcookie){
//     sessions.splice(sessions.indexOf(matchedcookie),1);
//     // Update the JSON file with the new data
//     try {
//       fs.writeFileSync('sessions.json', JSON.stringify(sessions, null, 2));
//       console.log("cookie deleted",cookie);
//     } catch (error) {
//       console.error('Error writing to JSON file:', error.message);
//     }
//   }
// });


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

