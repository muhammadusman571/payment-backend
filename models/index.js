const Payment = require("./Payment");
const Admin = require("./Admin");
const Game = require("./Game");
const Setting = require("./Setting");
const Announcement = require("./Announcement");
const Query = require("./Query");
const QueryLog = require("./QueryLog");
const QueryMessage = require("./QueryMessage");
const Notification = require("./notification");

Admin.associate?.({ Query, QueryMessage });
Query.associate?.({ Admin });
QueryMessage.associate?.({ Admin });

module.exports = {
  Payment,
  Admin,
  Game,
  Setting,
  Announcement,
  Query,
  QueryLog,
  QueryMessage,
  Notification,
};
