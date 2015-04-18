(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Евгений on 17.04.2015.
 */
//var webRTC = require('./webRTC');
var webRTC = require('./webRTC');
},{"./webRTC":3}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
/**
 * Created by Евгений on 16.04.2015.
 */
var socketClient = require('./socketClient.js');
var webRTC = (function (socketClient) {

    var getElementById = function (id) {
        var element;
        if (id[0] === '#') {
            element = document.querySelector(id);
        } else {
            element = document.getElementById(id);
        }
        return element
    };

    var webRTC = {};
    var STUN_SERVER_URL = 'stun:stun.l.google.com:19302';
    var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
    var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
    var pc; // PeerConnection

    var webRTCContainer, localVideoElement, remoteVideoElement;
    var webRTCContainerID = 'webRTCContainer',
        localVideoElementID = 'localVideo',
        remoteVideoElementID = 'remoteVideo';


    var iceServers = {
        iceServers: [{
            url: STUN_SERVER_URL
        }]
    };

    var optionalRtpDataChannels = {
        optional: [{
            RtpDataChannels: true
        }]
    };

    var init = function () {
        webRTCContainer = document.createElement('div');
        webRTCContainer.id = webRTCContainerID;

        localVideoElement = document.createElement('video');
        localVideoElement.id = localVideoElementID;
        localVideoElement.setAttribute('autoplay', 'true');
        localVideoElement.setAttribute('muted', 'true');

        remoteVideoElement = document.createElement('video');
        remoteVideoElement.id = remoteVideoElementID;
        remoteVideoElement.setAttribute('autoplay', 'true');


        webRTCContainer.appendChild(remoteVideoElement);
        webRTCContainer.appendChild(localVideoElement);

        navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        navigator.getUserMedia(
            {audio: true, video: true}, gotStream, function (error) {
                console.log(error)
            });

        document.addEventListener('DOMContentLoaded', function () {
            var body = document.querySelector('body');
            body.appendChild(webRTCContainer);
        });

        socketClient.on('message', messageHandler);
        socketClient.setRefClickFunction(createOffer);

    };


    var gotStream = function (stream) {
        localVideoElement.src = URL.createObjectURL(stream);
        pc = new PeerConnection(iceServers, optionalRtpDataChannels);
        pc.addStream(stream);
        pc.onicecandidate = gotIceCandidate;
        pc.onaddstream = gotRemoteStream;
    };

    var createOffer = function (toID) {
        pc.createOffer(
            function (description) {
                var msg = {toID: toID, data:description};
                pc.setLocalDescription(description);
                socketClient.sendMessage(msg);
            },
            function (error) {
                console.log(error)
            },
            {'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true}}
        );
    };


    var createAnswer = function (toID) {
        pc.createAnswer(
            function (description) {
                var msg = {toID: toID, data:description};
                pc.setLocalDescription(description);
                socketClient.sendMessage(msg);
            },
            function (error) {
                console.log(error)
            },
            {'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true}}
        );
    };


    //var gotLocalDescription = function (description) {
    //    pc.setLocalDescription(description);
    //    socketClient.sendMessage(description);
    //};

    var gotIceCandidate = function (event) {
        if (event.candidate) {
            socketClient.sendMessage({
                toID: event.candidate.toID,
                data: {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                }
            });
        }
    };

    var gotRemoteStream = function (event) {
        remoteVideoElement.src = URL.createObjectURL(event.stream);
    };

    var offerToAnswer = function(message){
        var acceptOffer = confirm("Someone " + message.id + " wants to speak to you");
        if(acceptOffer){
            createAnswer(message.id);
        }
    };

    var messageHandler = function (message) {
        if (message.data.type === 'offer') {
            pc.setRemoteDescription(new SessionDescription(message.data));
            offerToAnswer(message);
        }
        else if (message.data.type === 'answer') {
            pc.setRemoteDescription(new SessionDescription(message.data));
        }
        else if (message.data.type === 'candidate') {
            var candidate = new IceCandidate({sdpMLineIndex: message.data.label, candidate: message.data.candidate, toID:message.id});
            pc.addIceCandidate(candidate);
        }
    };


    init();




    return webRTC;

}(socketClient));


module.exports = webRTC;
},{"./socketClient.js":2}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2luZGV4LmpzIiwicHVibGljL2phdmFzY3JpcHRzL3NvY2tldENsaWVudC5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy93ZWJSVEMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcclxuICogQ3JlYXRlZCBieSDQldCy0LPQtdC90LjQuSBvbiAxNy4wNC4yMDE1LlxyXG4gKi9cclxuLy92YXIgd2ViUlRDID0gcmVxdWlyZSgnLi93ZWJSVEMnKTtcclxudmFyIHdlYlJUQyA9IHJlcXVpcmUoJy4vd2ViUlRDJyk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkg0JXQstCz0LXQvdC40Lkgb24gMTYuMDQuMjAxNS5cclxuICovXHJcbnZhciBzb2NrZXRDbGllbnQgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBnZXRFbGVtZW50QnlJZCA9IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHZhciBlbGVtZW50O1xyXG4gICAgICAgIGlmIChpZFswXSA9PT0gJyMnKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGlkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbWVudFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgc29ja2V0Q2xpZW50UmVmQ2xpY2tGdW5jdGlvbiA9IGZ1bmN0aW9uKCl7fTtcclxuICAgIHZhciBzZWxmSURDb250YWluZXJFbGVtZW50O1xyXG4gICAgdmFyIHNlbGZJRENvbnRhaW5lckVsZW1lbnRJRCA9ICdzZWxmSURDb250YWluZXInO1xyXG4gICAgdmFyIHNvY2tldENsaWVudENvbnRhaW5lckVsZW1lbnQ7XHJcbiAgICB2YXIgc29ja2V0Q2xpZW50Q29udGFpbmVyRWxlbWVudElEID0gJ3NvY2tldENsaWVudENvbnRhaW5lcic7XHJcbiAgICB2YXIgc29ja2V0Q2xpZW50UmVmQ2xhc3MgPSAnc29ja2V0Q2xpZW50UmVmJztcclxuICAgIHZhciBzb2NrZXRDbGllbnRSZWZJRFRlbXBsYXRlID0gJ3NvY2tldENsaWVudC0nO1xyXG5cclxuICAgIHZhciBQT1JUID0gMzAwMDtcclxuICAgIHZhciBzb2NrZXRDbGllbnQgPSB7fTtcclxuICAgIHZhciBzb2NrZXQgPSBpby5jb25uZWN0KCcnLCB7cG9ydDogUE9SVH0pO1xyXG5cclxuXHJcblxyXG5cclxuICAgIHZhciBpbml0ID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgc29ja2V0Lm9uKCdjb25uZWN0JywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XHJcbiAgICAgICAgICAgIHNlbGZJRENvbnRhaW5lckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgc2VsZklEQ29udGFpbmVyRWxlbWVudC5pZCA9IHNlbGZJRENvbnRhaW5lckVsZW1lbnRJRDtcclxuICAgICAgICAgICAgc2VsZklEQ29udGFpbmVyRWxlbWVudC5pbm5lckhUTUwgPSAnc2VsZiBpZDogJyArIHRoaXMuaWQ7XHJcbiAgICAgICAgICAgIGJvZHkuaW5zZXJ0QmVmb3JlKHNlbGZJRENvbnRhaW5lckVsZW1lbnQsIGJvZHkuZmlyc3RDaGlsZCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCB0aGlzLmlkKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBzb2NrZXQub24oJ2V4aXN0ZW50Q2xpZW50cycsIGZ1bmN0aW9uIChpZHMpIHtcclxuICAgICAgICAgICAgdmFyIHNvY2tldENsaWVudFJlZkVsZW1lbnQ7XHJcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IGlkcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXRDbGllbnRSZWZFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXRDbGllbnRSZWZFbGVtZW50LmlkID0gc29ja2V0Q2xpZW50UmVmSURUZW1wbGF0ZSArIGlkc1tpXTtcclxuICAgICAgICAgICAgICAgIHNvY2tldENsaWVudFJlZkVsZW1lbnQuY2xhc3NOYW1lID0gc29ja2V0Q2xpZW50UmVmQ2xhc3M7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXRDbGllbnRSZWZFbGVtZW50LmlubmVySFRNTCA9IGlkc1tpXTtcclxuICAgICAgICAgICAgICAgIHNvY2tldENsaWVudFJlZkVsZW1lbnQuZGF0YXNldC5pZCA9IGlkc1tpXTtcclxuICAgICAgICAgICAgICAgIHNvY2tldENsaWVudENvbnRhaW5lckVsZW1lbnQuYXBwZW5kQ2hpbGQoc29ja2V0Q2xpZW50UmVmRWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBzb2NrZXQub24oJ3JlbW92ZUNsaWVudCcsIGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgICAgICB2YXIgc29ja2V0Q2xpZW50UmVmRWxlbWVudCA9IGdldEVsZW1lbnRCeUlkKHNvY2tldENsaWVudFJlZklEVGVtcGxhdGUgKyBpZCk7XHJcbiAgICAgICAgICAgIHNvY2tldENsaWVudENvbnRhaW5lckVsZW1lbnQucmVtb3ZlQ2hpbGQoc29ja2V0Q2xpZW50UmVmRWxlbWVudCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc29ja2V0Lm9uKCduZXdDbGllbnQnLCBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICAgICAgdmFyIHNvY2tldENsaWVudFJlZkVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgc29ja2V0Q2xpZW50UmVmRWxlbWVudC5pZCA9IHNvY2tldENsaWVudFJlZklEVGVtcGxhdGUgKyBpZDtcclxuICAgICAgICAgICAgc29ja2V0Q2xpZW50UmVmRWxlbWVudC5jbGFzc05hbWUgPSBzb2NrZXRDbGllbnRSZWZDbGFzcztcclxuICAgICAgICAgICAgc29ja2V0Q2xpZW50UmVmRWxlbWVudC5pbm5lckhUTUwgPSBpZDtcclxuICAgICAgICAgICAgc29ja2V0Q2xpZW50UmVmRWxlbWVudC5kYXRhc2V0LmlkID0gaWQ7XHJcbiAgICAgICAgICAgIHNvY2tldENsaWVudENvbnRhaW5lckVsZW1lbnQuYXBwZW5kQ2hpbGQoc29ja2V0Q2xpZW50UmVmRWxlbWVudCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNvY2tldENsaWVudENvbnRhaW5lckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBzb2NrZXRDbGllbnRDb250YWluZXJFbGVtZW50LmlkID0gc29ja2V0Q2xpZW50Q29udGFpbmVyRWxlbWVudElEO1xyXG5cclxuXHJcbiAgICAgICAgc29ja2V0Q2xpZW50Q29udGFpbmVyRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XHJcbiAgICAgICAgICAgIGlmKHRhcmdldC5jbGFzc05hbWUuaW5kZXhPZihzb2NrZXRDbGllbnRSZWZDbGFzcykgPiAtMSl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0YXJnZXQuZGF0YXNldC5pZCk7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXRDbGllbnRSZWZDbGlja0Z1bmN0aW9uKHRhcmdldC5kYXRhc2V0LmlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xyXG4gICAgICAgICAgICBib2R5LmFwcGVuZENoaWxkKHNvY2tldENsaWVudENvbnRhaW5lckVsZW1lbnQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG5cclxuXHJcblxyXG4gICAgc29ja2V0Q2xpZW50LnNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcclxuICAgICAgICBzb2NrZXQuZW1pdCgnbWVzc2FnZScsIG1lc3NhZ2UpO1xyXG4gICAgfTtcclxuICAgIHNvY2tldENsaWVudC5vbiA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGZ1bmMpIHtcclxuICAgICAgICBzb2NrZXQub24oZXZlbnROYW1lLCBmdW5jKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIHNvY2tldENsaWVudC5zZXRSZWZDbGlja0Z1bmN0aW9uID0gZnVuY3Rpb24oZnVuYyl7XHJcbiAgICAgICAgc29ja2V0Q2xpZW50UmVmQ2xpY2tGdW5jdGlvbiA9IGZ1bmM7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICBpbml0KCk7XHJcblxyXG5cclxuICAgIHJldHVybiBzb2NrZXRDbGllbnQ7XHJcblxyXG59KCkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzb2NrZXRDbGllbnQ7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkg0JXQstCz0LXQvdC40Lkgb24gMTYuMDQuMjAxNS5cclxuICovXHJcbnZhciBzb2NrZXRDbGllbnQgPSByZXF1aXJlKCcuL3NvY2tldENsaWVudC5qcycpO1xyXG52YXIgd2ViUlRDID0gKGZ1bmN0aW9uIChzb2NrZXRDbGllbnQpIHtcclxuXHJcbiAgICB2YXIgZ2V0RWxlbWVudEJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgZWxlbWVudDtcclxuICAgICAgICBpZiAoaWRbMF0gPT09ICcjJykge1xyXG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHdlYlJUQyA9IHt9O1xyXG4gICAgdmFyIFNUVU5fU0VSVkVSX1VSTCA9ICdzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyJztcclxuICAgIHZhciBQZWVyQ29ubmVjdGlvbiA9IHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fCB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XHJcbiAgICB2YXIgSWNlQ2FuZGlkYXRlID0gd2luZG93Lm1velJUQ0ljZUNhbmRpZGF0ZSB8fCB3aW5kb3cuUlRDSWNlQ2FuZGlkYXRlO1xyXG4gICAgdmFyIFNlc3Npb25EZXNjcmlwdGlvbiA9IHdpbmRvdy5tb3pSVENTZXNzaW9uRGVzY3JpcHRpb24gfHwgd2luZG93LlJUQ1Nlc3Npb25EZXNjcmlwdGlvbjtcclxuICAgIHZhciBwYzsgLy8gUGVlckNvbm5lY3Rpb25cclxuXHJcbiAgICB2YXIgd2ViUlRDQ29udGFpbmVyLCBsb2NhbFZpZGVvRWxlbWVudCwgcmVtb3RlVmlkZW9FbGVtZW50O1xyXG4gICAgdmFyIHdlYlJUQ0NvbnRhaW5lcklEID0gJ3dlYlJUQ0NvbnRhaW5lcicsXHJcbiAgICAgICAgbG9jYWxWaWRlb0VsZW1lbnRJRCA9ICdsb2NhbFZpZGVvJyxcclxuICAgICAgICByZW1vdGVWaWRlb0VsZW1lbnRJRCA9ICdyZW1vdGVWaWRlbyc7XHJcblxyXG5cclxuICAgIHZhciBpY2VTZXJ2ZXJzID0ge1xyXG4gICAgICAgIGljZVNlcnZlcnM6IFt7XHJcbiAgICAgICAgICAgIHVybDogU1RVTl9TRVJWRVJfVVJMXHJcbiAgICAgICAgfV1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIG9wdGlvbmFsUnRwRGF0YUNoYW5uZWxzID0ge1xyXG4gICAgICAgIG9wdGlvbmFsOiBbe1xyXG4gICAgICAgICAgICBSdHBEYXRhQ2hhbm5lbHM6IHRydWVcclxuICAgICAgICB9XVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB3ZWJSVENDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB3ZWJSVENDb250YWluZXIuaWQgPSB3ZWJSVENDb250YWluZXJJRDtcclxuXHJcbiAgICAgICAgbG9jYWxWaWRlb0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xyXG4gICAgICAgIGxvY2FsVmlkZW9FbGVtZW50LmlkID0gbG9jYWxWaWRlb0VsZW1lbnRJRDtcclxuICAgICAgICBsb2NhbFZpZGVvRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2F1dG9wbGF5JywgJ3RydWUnKTtcclxuICAgICAgICBsb2NhbFZpZGVvRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ211dGVkJywgJ3RydWUnKTtcclxuXHJcbiAgICAgICAgcmVtb3RlVmlkZW9FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgICAgICByZW1vdGVWaWRlb0VsZW1lbnQuaWQgPSByZW1vdGVWaWRlb0VsZW1lbnRJRDtcclxuICAgICAgICByZW1vdGVWaWRlb0VsZW1lbnQuc2V0QXR0cmlidXRlKCdhdXRvcGxheScsICd0cnVlJyk7XHJcblxyXG5cclxuICAgICAgICB3ZWJSVENDb250YWluZXIuYXBwZW5kQ2hpbGQocmVtb3RlVmlkZW9FbGVtZW50KTtcclxuICAgICAgICB3ZWJSVENDb250YWluZXIuYXBwZW5kQ2hpbGQobG9jYWxWaWRlb0VsZW1lbnQpO1xyXG5cclxuICAgICAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWE7XHJcbiAgICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYShcclxuICAgICAgICAgICAge2F1ZGlvOiB0cnVlLCB2aWRlbzogdHJ1ZX0sIGdvdFN0cmVhbSwgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xyXG4gICAgICAgICAgICBib2R5LmFwcGVuZENoaWxkKHdlYlJUQ0NvbnRhaW5lcik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNvY2tldENsaWVudC5vbignbWVzc2FnZScsIG1lc3NhZ2VIYW5kbGVyKTtcclxuICAgICAgICBzb2NrZXRDbGllbnQuc2V0UmVmQ2xpY2tGdW5jdGlvbihjcmVhdGVPZmZlcik7XHJcblxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgdmFyIGdvdFN0cmVhbSA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcclxuICAgICAgICBsb2NhbFZpZGVvRWxlbWVudC5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKHN0cmVhbSk7XHJcbiAgICAgICAgcGMgPSBuZXcgUGVlckNvbm5lY3Rpb24oaWNlU2VydmVycywgb3B0aW9uYWxSdHBEYXRhQ2hhbm5lbHMpO1xyXG4gICAgICAgIHBjLmFkZFN0cmVhbShzdHJlYW0pO1xyXG4gICAgICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gZ290SWNlQ2FuZGlkYXRlO1xyXG4gICAgICAgIHBjLm9uYWRkc3RyZWFtID0gZ290UmVtb3RlU3RyZWFtO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgY3JlYXRlT2ZmZXIgPSBmdW5jdGlvbiAodG9JRCkge1xyXG4gICAgICAgIHBjLmNyZWF0ZU9mZmVyKFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoZGVzY3JpcHRpb24pIHtcclxuICAgICAgICAgICAgICAgIHZhciBtc2cgPSB7dG9JRDogdG9JRCwgZGF0YTpkZXNjcmlwdGlvbn07XHJcbiAgICAgICAgICAgICAgICBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKGRlc2NyaXB0aW9uKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldENsaWVudC5zZW5kTWVzc2FnZShtc2cpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7J21hbmRhdG9yeSc6IHsnT2ZmZXJUb1JlY2VpdmVBdWRpbyc6IHRydWUsICdPZmZlclRvUmVjZWl2ZVZpZGVvJzogdHJ1ZX19XHJcbiAgICAgICAgKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIHZhciBjcmVhdGVBbnN3ZXIgPSBmdW5jdGlvbiAodG9JRCkge1xyXG4gICAgICAgIHBjLmNyZWF0ZUFuc3dlcihcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGRlc2NyaXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0ge3RvSUQ6IHRvSUQsIGRhdGE6ZGVzY3JpcHRpb259O1xyXG4gICAgICAgICAgICAgICAgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihkZXNjcmlwdGlvbik7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXRDbGllbnQuc2VuZE1lc3NhZ2UobXNnKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeydtYW5kYXRvcnknOiB7J09mZmVyVG9SZWNlaXZlQXVkaW8nOiB0cnVlLCAnT2ZmZXJUb1JlY2VpdmVWaWRlbyc6IHRydWV9fVxyXG4gICAgICAgICk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvL3ZhciBnb3RMb2NhbERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGRlc2NyaXB0aW9uKSB7XHJcbiAgICAvLyAgICBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKGRlc2NyaXB0aW9uKTtcclxuICAgIC8vICAgIHNvY2tldENsaWVudC5zZW5kTWVzc2FnZShkZXNjcmlwdGlvbik7XHJcbiAgICAvL307XHJcblxyXG4gICAgdmFyIGdvdEljZUNhbmRpZGF0ZSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC5jYW5kaWRhdGUpIHtcclxuICAgICAgICAgICAgc29ja2V0Q2xpZW50LnNlbmRNZXNzYWdlKHtcclxuICAgICAgICAgICAgICAgIHRvSUQ6IGV2ZW50LmNhbmRpZGF0ZS50b0lELFxyXG4gICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjYW5kaWRhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBldmVudC5jYW5kaWRhdGUuc2RwTUxpbmVJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICBpZDogZXZlbnQuY2FuZGlkYXRlLnNkcE1pZCxcclxuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGU6IGV2ZW50LmNhbmRpZGF0ZS5jYW5kaWRhdGVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ290UmVtb3RlU3RyZWFtID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgcmVtb3RlVmlkZW9FbGVtZW50LnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZXZlbnQuc3RyZWFtKTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIG9mZmVyVG9BbnN3ZXIgPSBmdW5jdGlvbihtZXNzYWdlKXtcclxuICAgICAgICB2YXIgYWNjZXB0T2ZmZXIgPSBjb25maXJtKFwiU29tZW9uZSBcIiArIG1lc3NhZ2UuaWQgKyBcIiB3YW50cyB0byBzcGVhayB0byB5b3VcIik7XHJcbiAgICAgICAgaWYoYWNjZXB0T2ZmZXIpe1xyXG4gICAgICAgICAgICBjcmVhdGVBbnN3ZXIobWVzc2FnZS5pZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbWVzc2FnZUhhbmRsZXIgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xyXG4gICAgICAgIGlmIChtZXNzYWdlLmRhdGEudHlwZSA9PT0gJ29mZmVyJykge1xyXG4gICAgICAgICAgICBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgU2Vzc2lvbkRlc2NyaXB0aW9uKG1lc3NhZ2UuZGF0YSkpO1xyXG4gICAgICAgICAgICBvZmZlclRvQW5zd2VyKG1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChtZXNzYWdlLmRhdGEudHlwZSA9PT0gJ2Fuc3dlcicpIHtcclxuICAgICAgICAgICAgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24obmV3IFNlc3Npb25EZXNjcmlwdGlvbihtZXNzYWdlLmRhdGEpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobWVzc2FnZS5kYXRhLnR5cGUgPT09ICdjYW5kaWRhdGUnKSB7XHJcbiAgICAgICAgICAgIHZhciBjYW5kaWRhdGUgPSBuZXcgSWNlQ2FuZGlkYXRlKHtzZHBNTGluZUluZGV4OiBtZXNzYWdlLmRhdGEubGFiZWwsIGNhbmRpZGF0ZTogbWVzc2FnZS5kYXRhLmNhbmRpZGF0ZSwgdG9JRDptZXNzYWdlLmlkfSk7XHJcbiAgICAgICAgICAgIHBjLmFkZEljZUNhbmRpZGF0ZShjYW5kaWRhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIGluaXQoKTtcclxuXHJcblxyXG5cclxuXHJcbiAgICByZXR1cm4gd2ViUlRDO1xyXG5cclxufShzb2NrZXRDbGllbnQpKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHdlYlJUQzsiXX0=
