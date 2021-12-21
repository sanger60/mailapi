const router = require("express").Router();
const nodemailer = require("nodemailer");
const Mailparser = require("mailparser");
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

const getMail = (msgId, auth) => {
  const gmail = google.gmail({version: 'v1', auth});
  //This api call will fetch the mailbody.
  gmail.users.messages.get({
      userId:'me',
      id: msgId ,
  }, (err, res) => {
    console.log(res.data.labelIds.INBOX)
      if(!err){
        console.log("no error")
          var body = res.data.payload.parts[0].body.data;

          var htmlBody = base64.decode(body.replace(/-/g, '+').replace(/_/g, '/'));
          console.log(htmlBody)
          var mailparser = new Mailparser();

          mailparser.on("end", (err,res) => {
              console.log("res",res);
          })

          mailparser.on('data', (dat) => {
              if(dat.type === 'text'){
                  const $ = cheerio.load(dat.textAsHtml);
                  var links = [];
                  var modLinks = [];
                  $('a').each(function(i) {
                      links[i] = $(this).attr('href');
                  });

                  //Regular Expression to filter out an array of urls.
                  var pat = /------[0-9]-[0-9][0-9]/;

                  //A new array modLinks is created which stores the urls.
                  modLinks = links.filter(li => {
                      if(li.match(pat) !== null){
                          return true;
                      }
                      else{
                          return false;
                      }
                  });
                  console.log(modLinks);

                  //This function is called to open all links in the array.

              }
          })

          mailparser.write(htmlBody);
          mailparser.end();

      }
  });
}

// const useGetMail = async (auth,query) => {
//   const messages = await listMail(auth, query);
//   return messages;
// }

router.route("/list").get((req, res) => {
  listMail(OAuth2Client, 'destek@bionluk.com').then((result) => {
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
