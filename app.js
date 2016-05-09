// SKYNET.JS 


'use strict';


var weather = require('weather-js');
var format = require('date-format');
var Bot = require('telebot');
var db = require('diskdb');




// CONECT DATA BASE
db =  db.connect(__dirname +'/db',['skynet','users']);

// KEY API TELEGRAM GET ENVIROMENT VAR
var telegramKey = process.env.TELEGRAMKEY


// CONFIGURE BOT 
var bot = new Bot({  
  token: telegramKey
  ,modules:{

    
    users:{
      getUserId :  function(ID){
          return db.users.findOne({"id": ID});

        },

       putUserLog : function(msg){
          var user = {};
          user=this.getUserId(msg.from.id);
          console.log("Find user: %j",  user);
          if(typeof user === 'undefined'){
            console.log("Insert user " + msg.from.first_name)
            user={ 
            "id":msg.from.id,
            "first_name": msg.from.first_name,
            "last_name": msg.from.last_name,
            "log":[]};
            db.users.save(user);
            
          }
          

          var log = {
            id:msg.message_id,
            date: Date.now(),
            time: msg.date,
            text:msg.text
              }
           user.log.push(log);
           db.users.update({"id":msg.from.id},user,{upsert:true});
           
        } 
}, 
    skynet:{

      


       clim : function (message,where,scale,lenguage){
  

 
   weather.find({search: where, degreeType: scale ,lang:lenguage},function(err, result,txt) 
   {
                  if(err) console.log(err);
                  var clima = result[0];
                  console.log(message.from.first_name + ", Ha solicitado informacion meteorologica");
               
                   
                  var climStr ="";
                   climStr +=   "<strong> -= INFOMACION DEL TIEMPO =-</strong> \n\n";
                   clima.forecast.forEach(function(item){
                       climStr +=  "El tiempo para el <strong> " + item.day + " " + format.asString('dd/MM/yyyy', new Date(item.date) )+ "  " +item.skytextday + "</strong> con una <strong>temperatura máxima de " + item.high + "ºC y una minima de " + item.low + "ºC </strong> y una probabilidad de lluvias del " + item.precip +"%\n\n\n";
                   });

                    climStr +=  "\n Espero haberle sido de ayuda " + message.from.first_name;
                   let parse = 'html';
                    bot.sendMessage(message.from.id,  climStr,{parse});

                    
                                          
    });
                    
      
  }
 }


}
});





// EVENT INCOMING TEXT MESSAGE 
bot.on('text', msg => {
  if(!msg.entities){
  let fromId = msg.from.id;
  let firstName = msg.from.first_name;
  let reply = msg.message_id;
  bot.cfg.modules.users.putUserLog(msg);
  return bot.sendMessage(fromId, `Realmente quieres una respuesta, ${ firstName }!, prueba a mandarme el mensaje /CLIMA`, { reply });}
});


// EVENT INCOMING COMMAND MESSAGE 
bot.on('/*', msg => {
  let command= msg.text.toUpperCase();
  bot.cfg.modules.users.putUserLog(msg);

  var order = db.skynet.find({command:command});
  
  
  
  if (order.length > 0 ){
             
             var txt ="";
             
              txt = eval(order[0].actions);
                console.log("TXT: "+txt);
              bot.sendMessage(msg.from.id,txt);
       }
    else{
          if(order.length <= 0 )
            console.log("Orden "+ command + " no encontrada.");
          else {
          var holaMundo = {
            command : 'HOLA',
            actions : ' this.bot.sendMessage({ chat_id: message.from.id, text: "Hola " + message.from.first_name + " ¿que puedo hacer por ti?"}).then(function (result) {});'
          };
            this.db.skynet.save(holaMundo);
          }

       }
});


// EVENT START CHAT
bot.on(['/start', '/START'], function(msg) {
  
  let promise;
  let id = msg.chat.id;
  let firstName = msg.from.first_name;

  var wellcome = '¡ 😿 Bien Venido ' + firstName  + ' !.';

   
   bot.cfg.modules.users.putUserLog(msg);
  
    promise = bot.sendPhoto(id, __dirname +'/img/start.jpg', { caption:wellcome  });

  
  // Send "uploading photo" action
  bot.sendAction(id, 'upload_photo');
 
  return promise.catch(error => {
    console.log('[error]', error);
    // Send an error
    bot.sendMessage(id, '😿 An error ${ error } occurred, try again.');
  });
  

  });







// EXIT PROGRAM
bot.on(['/desconectar','/DESCONECTAR','/EXIT','/exit','/SALIR','/salir'], x => bot.disconnect('A dios!'));

// CONNECT TO TELEGRAM
bot.connect();
