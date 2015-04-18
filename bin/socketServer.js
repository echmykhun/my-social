/**
 * Created by Евгений on 17.04.2015.
 */
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
var clients = {};
var clientsIDs = [];

exports.listen = function(server){
    io = socketio.listen(server);

    io.sockets.on('connection', function (socket) {
        function log() {
            var array = [">>> "];
            for(var i = 0; i < arguments.length; i++) {
                array.push(arguments[i]);
            }
            //socket.emit('log', array);
            console.log('log', array);
        }

        socket.emit('existentClients', clientsIDs);
        socket.broadcast.emit('newClient', socket.id);
        clients[socket.id] = socket;
        clientsIDs.push(socket.id);

        console.log(clientsIDs);


        socket.on('message', function (message) {
            //log('Got message: ', message);
            var msg = {id: this.id, data: message.data};
            if(message.toID){
                clients[message.toID].emit('message', msg);
            }else {
                socket.broadcast.emit('message', msg);
            }
        });
        //
        //
        //socket.on('create or join', function (room) {
        //    guestNumber = io.sockets.adapter.rooms[room].length;
        //
        //    log('Room ' + room + ' has ' + guestNumber + ' client(s)');
        //    log('Request to create or join room', room);
        //
        //    if(guestNumber == 0) {
        //        socket.join(room);
        //        socket.emit('created', room);
        //    }
        //
        //    else {
        //        io.sockets.in(room).emit('join', room);
        //        socket.join(room);
        //        socket.emit('joined', room);
        //    }
        //
        //
        //    //socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
        //    //socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
        //});


        socket.on('disconnect', function(){
            broadcast('removeClient', socket.id);
            clientsIDs.splice(clientsIDs.indexOf(socket.id), 1);
            delete clients[socket.id];
        })

    });
};

function sendMessage(socketId, data) {
    if (clients[socketId]) {
        clients[socketId].send({message: data});
    }
}

function broadcast(type, data){
    for(var i in clients){
        clients[i].emit(type, data);
    }
}