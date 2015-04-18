/**
 * Created by Евгений on 16.04.2015.
 */
var socketClient = (function () {

    var getElementById = function (id) {
        var element;
        if (id[0] === '#') {
            element = document.querySelector(id);
        } else {
            element = document.getElementById(id);
        }
        return element
    };

    var socketClientRefClickFunction = function(){};
    var selfIDContainerElement;
    var selfIDContainerElementID = 'selfIDContainer';
    var socketClientContainerElement;
    var socketClientContainerElementID = 'socketClientContainer';
    var socketClientRefClass = 'socketClientRef';
    var socketClientRefIDTemplate = 'socketClient-';

    var PORT = 3000;
    var socketClient = {};
    var socket = io.connect('', {port: PORT});




    var init = function(){

        socket.on('connect', function(){
            var body = document.querySelector('body');
            selfIDContainerElement = document.createElement('div');
            selfIDContainerElement.id = selfIDContainerElementID;
            selfIDContainerElement.innerHTML = 'self id: ' + this.id;
            body.insertBefore(selfIDContainerElement, body.firstChild);
            console.log( this.id);
        });
        socket.on('existentClients', function (ids) {
            var socketClientRefElement;
            for(var i = 0; i< ids.length; i++){
                socketClientRefElement = document.createElement('div');
                socketClientRefElement.id = socketClientRefIDTemplate + ids[i];
                socketClientRefElement.className = socketClientRefClass;
                socketClientRefElement.innerHTML = ids[i];
                socketClientRefElement.dataset.id = ids[i];
                socketClientContainerElement.appendChild(socketClientRefElement);
            }
        });
        socket.on('removeClient', function (id) {
            var socketClientRefElement = getElementById(socketClientRefIDTemplate + id);
            socketClientContainerElement.removeChild(socketClientRefElement);
        });
        socket.on('newClient', function (id) {
            var socketClientRefElement = document.createElement('div');
            socketClientRefElement.id = socketClientRefIDTemplate + id;
            socketClientRefElement.className = socketClientRefClass;
            socketClientRefElement.innerHTML = id;
            socketClientRefElement.dataset.id = id;
            socketClientContainerElement.appendChild(socketClientRefElement);
        });

        socketClientContainerElement = document.createElement('div');
        socketClientContainerElement.id = socketClientContainerElementID;


        socketClientContainerElement.addEventListener('click', function(e){
            var target = e.target;
            if(target.className.indexOf(socketClientRefClass) > -1){
                console.log(target.dataset.id);
                socketClientRefClickFunction(target.dataset.id);
            }
        });



        document.addEventListener('DOMContentLoaded', function () {
            var body = document.querySelector('body');
            body.appendChild(socketClientContainerElement);
        });

    };




    socketClient.sendMessage = function (message) {
        socket.emit('message', message);
    };
    socketClient.on = function (eventName, func) {
        socket.on(eventName, func);
    };


    socketClient.setRefClickFunction = function(func){
        socketClientRefClickFunction = func;
    };


    init();


    return socketClient;

}());

module.exports = socketClient;