const router = require("express").Router();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

//Google Analytics Reporting API
const scopes = "https://www.googleapis.com/auth/gmail.readonly";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

const getAnalyticsReporting = async () => {
  const response = await jwt.authorize().catch((error) => {
    if (error) console.log(error);
  });

  // const result = await google
  //   .analytics("v3")
  //   .data.ga.get({
  //     auth: jwt,
  //     ids: "ga:" + view_id,
  //     "start-date": "30daysAgo",
  //     "end-date": "today",
  //     metrics: "ga:pageviews,ga:avgTimeOnPage,ga:uniquePageviews",
  //     dimensions: "ga:pagePath",
  //   })
  //   .catch((error) => {
  //     if (error) console.log(error);
  //   });

  return result;
};

router.route("/list").get((req, res) => {
  // getAnalyticsReporting()
  //   .then((response) => {
  //     Project.find({ user_id: req.query.userId })
  //       .select("project_id name banner -_id")
  //       .lean()
  //       .exec((err, projects) => {
  //         if (err) {
  //           res.sendStatus(400);
  //         }
  //         var userProjects = projects.reduce(function (acc, curVal) {
  //           return acc.concat("/preview/" + curVal.project_id);
  //         }, []);

  //         var userAnalyticsReport = response.data.rows.filter((item) =>
  //           userProjects.includes(item[0])
  //         );

  //         userAnalyticsReport.forEach((gaItem) => {
  //           let currentProj = projects.find(
  //             (proj) => "/preview/" + proj.project_id === gaItem[0]
  //           );
  //           var dt = new Date("December 30, 2017 00:00:00");
  //           dt.setSeconds(parseInt(gaItem[2].split(".")[0]));
  //           var editableTimeSpent = dt.getMinutes() + "." + dt.getSeconds();

  //           gaItem[0] = currentProj;
  //           gaItem[2] = editableTimeSpent;
  //         });

  //         res.status(201).json(userAnalyticsReport);
  //       });
  //     // res..send(response);
  //   })
  //   .catch((error) => {
  //     if (error) throw Error;
  //   });
});

module.exports = router;
