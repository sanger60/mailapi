const router = require("express").Router();
const nodemailer = require("nodemailer");
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

const listMail = (auth,query) => {
  // const gmail = google.gmail({version: 'v1', auth});    
  // const result = await gmail.users.messages.list({userId: 'me',q: query});

  return new Promise((resolve, reject) => {    
    const gmail = google.gmail({version: 'v1', auth});    
    gmail.users.messages.list(      
      {        
        userId: 'me',        
        q:query,      
        maxResults:5    
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
  })
}

// const useGetMail = async (auth,query) => {
//   const messages = await listMail(auth, query);
//   return messages;
// }

router.route("/list").get((req, res) => {
  listMail(OAuth2Client, 'label:inbox subject:reminder').then((result) => {
    res.status(200).send(result);
  }).catch((error) => {
    res.status(200).send(error);
  });
});

router.route("/send").post((req, res) => {
  sendMail(req.body.to,req.body.subject,req.body.text).then((result) => {
    res.status(200).send(result);
  }).catch((error) => {
    res.status(200).send(error);
  });
});

module.exports = router;
