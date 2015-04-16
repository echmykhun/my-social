/**
 * Created by Евгений on 16.04.2015.
 */

var transport = (function () {

    var PORT = 3000;
    var transport = {};
    var socket = io.connect('', {port: PORT});

    transport.sendMessage = function (message) {
        socket.emit('message', message);
    };
    transport.on = function (eventName, func) {
        socket.on(eventName, func);
    };


    return transport;

}());

module.exports = transport;