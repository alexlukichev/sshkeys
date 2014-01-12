/*
 * 
 * sshkeys.js
 *
 * Copyright (c) 2014 Alexander Lukichev. All rights reserved
 * 
 */
var MongoClient = require("mongodb").MongoClient
  , fs = require("fs");
  
var options = {};  // See parseArgs()

var context = {};

//---------------------------------------------------------------------------


function updateKeys() {
    
    var next = function() {
        setTimeout(updateKeys, 5);
    };
    
    context.users.find().toArray(function (err, users) {
          if (err) {
              console.trace(err);
              next();
          } else {              
              var s = "";
              for (var i=0; i<users.length; i++) {
                  if (users[i].sshKeys) {
                      for (var j=0; j<users[i].sshKeys.length; j++) {
                        s += "command=\"$HOME/tools/session "+users[i]._id+" $SSH_ORIGINAL_COMMAND\",no-agent-forwarding,no-user-rc,no-X11-forwarding,no-port-forwarding " + users[i].sshKeys[j]+"\n";
                    }
                  }
              }              
              fs.writeFile(context.sshDir+"/authorized_keys", 
                  s, function (err) {
                      if (err) {
                          console.trace(err);
                      }
                      next();
                  });
          }
      });
}


//---------------------------------------------------------------------------

function usage() {
  console.log();
  console.log("Usage: node sshkeys.js mongoURL sshDir");
  console.log();
}

//---------------------------------------------------------------------------

// Parse arguments
// the arguments come in the following order:
// node sshkeys.js mongoURL sshDir
function parseArgs() {
  var i, remaining;
  var args = process.argv;
  
  if (args.length < 4) {
    return false;
  }
  
  options.sshDir = args[args.length - 1];
  options.mongoUrl = args[args.length - 2];
  
  return true;
}

//---------------------------------------------------------------------------

(function main() {
  if (parseArgs()) {    
    console.log("SSH Dir: " + options.sshDir);
    console.log("Mongo URL: " + options.mongoUrl);    
    
    MongoClient.connect(options.mongoUrl, function (err, db) {
        if (err) {
            console.log("could not connect to mongo db: "+err);
        } else {
            context.users = db.collection("users");
            context.sshDir = options.sshDir;
            
            updateKeys();
        }
    });
    
  } else {
    usage();
  }
  
})();
