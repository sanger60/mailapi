const router = require("express").Router();
const nodemailer = require("nodemailer");
const readline = require('readline');
const MailParser = require('mailparser').MailParser;
const cheerio = require('cheerio');
const { base64encode, base64decode } = require('nodejs-base64');
const { google } = require("googleapis");
require("dotenv").config();

//Google Analytics Reporting API
const scopes = "https://www.googleapis.com/auth/gmail.readonly";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

const OAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID,process.env.CLIENT_SECRET,process.env.REDIRECT_URI);
OAuth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN});

const sendMail = async (to,subject,text) => {
  try{
    const accessToken = await OAuth2Client.getAccessToken();
    let mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type:"OAuth2",
        user: 'lgatsoft@gmail.com',
        clientId:process.env.CLIENT_ID,
        clientSecret:process.env.CLIENT_SECRET,
        refreshToken:process.env.REFRESH_TOKEN,
        accessToken:accessToken
      }
    });

    let mailDetails = {
      from: 'lgatsoft@gmail.com',
      to: to,
      subject: subject,
      text: text
    };

    const result = await mailTransporter.sendMail(mailDetails)
    return result;
  }catch(error){
    console.log(error);
  }
}

const getNewToken = (oAuth2Client, callback) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      console.log(token);
      oAuth2Client.setCredentials(token);

      callback(oAuth2Client);
    });
  });
}

const listMail = (auth,query) => {
  // const gmail = google.gmail({version: 'v1', auth});    
  // const result = await gmail.users.messages.list({userId: 'me',q: query});

  return new Promise((resolve, reject) => {    
    const gmail = google.gmail({version: 'v1', auth});    
    gmail.users.messages.list(      
      {        
        userId: 'me',        
        q:'' 
      },(err, res) => {        
        if (err) {                    
          reject(err);          
          return;        
        }        
        if (!res.data.messages) {                    
          resolve([]);          
          return;       
        }
        resolve(res.data.messages);      
      }    
    );  
  });
}


// const listLabels = (auth) => {
//   // const gmail = google.gmail({version: 'v1', auth});
//   // gmail.users.labels.list({
//   //   userId: 'me',
//   // }, (err, res) => {
//   //   if (err) return 'The API returned an error: ' + err;
//   //   const labels = res.data.labels;
//   //   if (labels.length) {
//   //     return labels;
//   //   } else {
//   //     return 'No labels found.';
//   //   }
//   // });

//   return new Promise((resolve, reject) => {    
//     const gmail = google.gmail({version: 'v1', auth});    
//     gmail.users.labels.list(      
//       {        
//         userId: 'me'  
//       },(err, res) => {        
//         if (err) {                    
//           reject(err);          
//           return;        
//         }        
//         if (!res.data.labels) {                    
//           resolve([]);          
//           return;       
//         }
//         resolve(res.data.labels);      
//       }    
//     );  
//   });
// }

const getMail = (msgId, auth) => {
  return new Promise((resolve, reject) => {    
    const gmail = google.gmail({version: 'v1', auth});
    gmail.users.messages.get({
      userId:'me',
      id: msgId ,
    }, (err, res) => {        
        if (err) {                    
          reject(err);          
          return;        
        }        
        if (!res.data.payload) {                    
          resolve([]);          
          return;       
        }

        // for(var i=0;i< res.data.payload.parts.length;i++){
        //   if(res.data.payload.parts[i].mimeType == "text/html"){
        //     var body = res.data.payload.parts[i].body.data;
        //     var htmlBody = base64decode(body.replace(/-/g, '+').replace(/_/g, '/'));
        // var body = res.data.payload.parts[0].body.data;
        var body = res.data.payload.body.data != null ? [base64decode(res.data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))] : [];
        if(body == ""){
          for(var i=0;i< res.data.payload.parts.length;i++){
            if(res.data.payload.parts[i].body.data != null){
              var htmlBody = base64decode(res.data.payload.parts[i].body.data.replace(/-/g, '+').replace(/_/g, '/'));
              body.push(htmlBody);
            }
          }
        }
        var from = res.data.payload.headers.find(x=> x.name == "From");
        from = from != null ? from.value : "";
        var to = res.data.payload.headers.find(x=> x.name == "To");
        to = to != null ? to.value : "";
        var date = res.data.payload.headers.find(x=> x.name == "Date");
        date = date != null ? date.value : "";
        var subject = res.data.payload.headers.find(x=> x.name == "Subject");
        subject = subject != null ? subject.value : "";

        resolve({innerMail:body, subject:subject, to:to, from:from, date:date});

      }    
    );  
  });
}

// const useGetMail = async (auth,query) => {
//   const messages = await listMail(auth, query);
//   return messages;
// }

router.route("/list").get((req, res) => {
  getNewToken(OAuth2Client);

  listMail(OAuth2Client, '*').then(async (result) => {
    const messages = [];
    
    console.log(result);

    for(var i=0;i< result.length;i++){
      await getMail(result[i].id, OAuth2Client).then((result2) => {
        messages.push(result2);
        
        if(i == result.length - 1){
          res.json(messages);
        }
      });
    }
    // res.status(200).send(messages);
  }).catch((error) => {
    res.status(200).send(error);
  });
  // const labels = listLabels(OAuth2Client);
  // res.status(200).send(JSON.stringify(labels));
});

router.route("/send").post((req, res) => {
  sendMail(req.body.to,req.body.subject,req.body.text).then((result) => {
    res.status(200).send(result);
  }).catch((error) => {
    res.status(200).send(error);
  });
});

module.exports = router;
