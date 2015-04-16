(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by Евгений on 17.04.2015.
 */
var $ = require('./webRTC');
},{"./webRTC":3}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
/**
 * Created by Евгений on 16.04.2015.
 */
var transport = require('./transport.js');
var webRTC = (function (transport) {

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

    var webRTCContainer, localVideoElement, remoteVideoElement, callButtonElement;
    var webRTCContainerID = 'webRTCContainer',
        localVideoElementID = 'localVideo',
        remoteVideoElementID = 'remoteVideo',
        callButtonElementID = 'callButton';


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

        callButtonElement = document.createElement('button');
        callButtonElement.id = callButtonElementID;
        callButtonElement.innerHTML ='✆';
        callButtonElement.addEventListener('click', function () {
            createOffer();
        });

        webRTCContainer.appendChild(remoteVideoElement);
        webRTCContainer.appendChild(localVideoElement);
        webRTCContainer.appendChild(callButtonElement);

        navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        navigator.getUserMedia(
            {audio: true, video: true}, gotStream, function (error) {
                console.log(error)
            });
        transport.on('message', messageHandler);
    };


    var gotStream = function (stream) {
        callButtonElement.style.display = 'inline-block';
        localVideoElement.src = URL.createObjectURL(stream);
        pc = new PeerConnection(iceServers, optionalRtpDataChannels);
        pc.addStream(stream);
        pc.onicecandidate = gotIceCandidate;
        pc.onaddstream = gotRemoteStream;
    };

    var createOffer = function () {
        pc.createOffer(
            gotLocalDescription,
            function (error) {
                console.log(error)
            },
            {'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true}}
        );
    };


    var createAnswer = function () {
        pc.createAnswer(
            gotLocalDescription,
            function (error) {
                console.log(error)
            },
            {'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true}}
        );
    };


    var gotLocalDescription = function (description) {
        pc.setLocalDescription(description);
        transport.sendMessage(description);
    };

    var gotIceCandidate = function (event) {
        if (event.candidate) {
            transport.sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        }
    };

    var gotRemoteStream = function (event) {
        remoteVideoElement.src = URL.createObjectURL(event.stream);
    };

    var messageHandler = function (message) {
        if (message.type === 'offer') {
            pc.setRemoteDescription(new SessionDescription(message));
            //createAnswer();
            console.log(message);
            var acceptOffer = confirm("Someone wants to speak to you");
            if(acceptOffer){
                createAnswer();
            }
        }
        else if (message.type === 'answer') {
            pc.setRemoteDescription(new SessionDescription(message));
        }
        else if (message.type === 'candidate') {
            var candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
            pc.addIceCandidate(candidate);
        }
    };


    init();

    document.addEventListener('DOMContentLoaded', function () {
        var body = document.querySelector('body');
        body.appendChild(webRTCContainer);
    });


    return webRTC;

}(transport));


module.exports = webRTC;
},{"./transport.js":2}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2luZGV4LmpzIiwicHVibGljL2phdmFzY3JpcHRzL3RyYW5zcG9ydC5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy93ZWJSVEMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcclxuICogQ3JlYXRlZCBieSDQldCy0LPQtdC90LjQuSBvbiAxNy4wNC4yMDE1LlxyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCcuL3dlYlJUQycpOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5INCV0LLQs9C10L3QuNC5IG9uIDE2LjA0LjIwMTUuXHJcbiAqL1xyXG5cclxudmFyIHRyYW5zcG9ydCA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIFBPUlQgPSAzMDAwO1xyXG4gICAgdmFyIHRyYW5zcG9ydCA9IHt9O1xyXG4gICAgdmFyIHNvY2tldCA9IGlvLmNvbm5lY3QoJycsIHtwb3J0OiBQT1JUfSk7XHJcblxyXG4gICAgdHJhbnNwb3J0LnNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcclxuICAgICAgICBzb2NrZXQuZW1pdCgnbWVzc2FnZScsIG1lc3NhZ2UpO1xyXG4gICAgfTtcclxuICAgIHRyYW5zcG9ydC5vbiA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGZ1bmMpIHtcclxuICAgICAgICBzb2NrZXQub24oZXZlbnROYW1lLCBmdW5jKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIHJldHVybiB0cmFuc3BvcnQ7XHJcblxyXG59KCkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0cmFuc3BvcnQ7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkg0JXQstCz0LXQvdC40Lkgb24gMTYuMDQuMjAxNS5cclxuICovXHJcbnZhciB0cmFuc3BvcnQgPSByZXF1aXJlKCcuL3RyYW5zcG9ydC5qcycpO1xyXG52YXIgd2ViUlRDID0gKGZ1bmN0aW9uICh0cmFuc3BvcnQpIHtcclxuXHJcbiAgICB2YXIgZ2V0RWxlbWVudEJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgZWxlbWVudDtcclxuICAgICAgICBpZiAoaWRbMF0gPT09ICcjJykge1xyXG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihpZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHdlYlJUQyA9IHt9O1xyXG4gICAgdmFyIFNUVU5fU0VSVkVSX1VSTCA9ICdzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyJztcclxuICAgIHZhciBQZWVyQ29ubmVjdGlvbiA9IHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fCB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XHJcbiAgICB2YXIgSWNlQ2FuZGlkYXRlID0gd2luZG93Lm1velJUQ0ljZUNhbmRpZGF0ZSB8fCB3aW5kb3cuUlRDSWNlQ2FuZGlkYXRlO1xyXG4gICAgdmFyIFNlc3Npb25EZXNjcmlwdGlvbiA9IHdpbmRvdy5tb3pSVENTZXNzaW9uRGVzY3JpcHRpb24gfHwgd2luZG93LlJUQ1Nlc3Npb25EZXNjcmlwdGlvbjtcclxuICAgIHZhciBwYzsgLy8gUGVlckNvbm5lY3Rpb25cclxuXHJcbiAgICB2YXIgd2ViUlRDQ29udGFpbmVyLCBsb2NhbFZpZGVvRWxlbWVudCwgcmVtb3RlVmlkZW9FbGVtZW50LCBjYWxsQnV0dG9uRWxlbWVudDtcclxuICAgIHZhciB3ZWJSVENDb250YWluZXJJRCA9ICd3ZWJSVENDb250YWluZXInLFxyXG4gICAgICAgIGxvY2FsVmlkZW9FbGVtZW50SUQgPSAnbG9jYWxWaWRlbycsXHJcbiAgICAgICAgcmVtb3RlVmlkZW9FbGVtZW50SUQgPSAncmVtb3RlVmlkZW8nLFxyXG4gICAgICAgIGNhbGxCdXR0b25FbGVtZW50SUQgPSAnY2FsbEJ1dHRvbic7XHJcblxyXG5cclxuICAgIHZhciBpY2VTZXJ2ZXJzID0ge1xyXG4gICAgICAgIGljZVNlcnZlcnM6IFt7XHJcbiAgICAgICAgICAgIHVybDogU1RVTl9TRVJWRVJfVVJMXHJcbiAgICAgICAgfV1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIG9wdGlvbmFsUnRwRGF0YUNoYW5uZWxzID0ge1xyXG4gICAgICAgIG9wdGlvbmFsOiBbe1xyXG4gICAgICAgICAgICBSdHBEYXRhQ2hhbm5lbHM6IHRydWVcclxuICAgICAgICB9XVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB3ZWJSVENDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB3ZWJSVENDb250YWluZXIuaWQgPSB3ZWJSVENDb250YWluZXJJRDtcclxuXHJcbiAgICAgICAgbG9jYWxWaWRlb0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xyXG4gICAgICAgIGxvY2FsVmlkZW9FbGVtZW50LmlkID0gbG9jYWxWaWRlb0VsZW1lbnRJRDtcclxuICAgICAgICBsb2NhbFZpZGVvRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2F1dG9wbGF5JywgJ3RydWUnKTtcclxuICAgICAgICBsb2NhbFZpZGVvRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ211dGVkJywgJ3RydWUnKTtcclxuXHJcbiAgICAgICAgcmVtb3RlVmlkZW9FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgICAgICByZW1vdGVWaWRlb0VsZW1lbnQuaWQgPSByZW1vdGVWaWRlb0VsZW1lbnRJRDtcclxuICAgICAgICByZW1vdGVWaWRlb0VsZW1lbnQuc2V0QXR0cmlidXRlKCdhdXRvcGxheScsICd0cnVlJyk7XHJcblxyXG4gICAgICAgIGNhbGxCdXR0b25FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgICAgICAgY2FsbEJ1dHRvbkVsZW1lbnQuaWQgPSBjYWxsQnV0dG9uRWxlbWVudElEO1xyXG4gICAgICAgIGNhbGxCdXR0b25FbGVtZW50LmlubmVySFRNTCA9J+Kchic7XHJcbiAgICAgICAgY2FsbEJ1dHRvbkVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZU9mZmVyKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHdlYlJUQ0NvbnRhaW5lci5hcHBlbmRDaGlsZChyZW1vdGVWaWRlb0VsZW1lbnQpO1xyXG4gICAgICAgIHdlYlJUQ0NvbnRhaW5lci5hcHBlbmRDaGlsZChsb2NhbFZpZGVvRWxlbWVudCk7XHJcbiAgICAgICAgd2ViUlRDQ29udGFpbmVyLmFwcGVuZENoaWxkKGNhbGxCdXR0b25FbGVtZW50KTtcclxuXHJcbiAgICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhO1xyXG4gICAgICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEoXHJcbiAgICAgICAgICAgIHthdWRpbzogdHJ1ZSwgdmlkZW86IHRydWV9LCBnb3RTdHJlYW0sIGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHRyYW5zcG9ydC5vbignbWVzc2FnZScsIG1lc3NhZ2VIYW5kbGVyKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIHZhciBnb3RTdHJlYW0gPSBmdW5jdGlvbiAoc3RyZWFtKSB7XHJcbiAgICAgICAgY2FsbEJ1dHRvbkVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snO1xyXG4gICAgICAgIGxvY2FsVmlkZW9FbGVtZW50LnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoc3RyZWFtKTtcclxuICAgICAgICBwYyA9IG5ldyBQZWVyQ29ubmVjdGlvbihpY2VTZXJ2ZXJzLCBvcHRpb25hbFJ0cERhdGFDaGFubmVscyk7XHJcbiAgICAgICAgcGMuYWRkU3RyZWFtKHN0cmVhbSk7XHJcbiAgICAgICAgcGMub25pY2VjYW5kaWRhdGUgPSBnb3RJY2VDYW5kaWRhdGU7XHJcbiAgICAgICAgcGMub25hZGRzdHJlYW0gPSBnb3RSZW1vdGVTdHJlYW07XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBjcmVhdGVPZmZlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBwYy5jcmVhdGVPZmZlcihcclxuICAgICAgICAgICAgZ290TG9jYWxEZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeydtYW5kYXRvcnknOiB7J09mZmVyVG9SZWNlaXZlQXVkaW8nOiB0cnVlLCAnT2ZmZXJUb1JlY2VpdmVWaWRlbyc6IHRydWV9fVxyXG4gICAgICAgICk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICB2YXIgY3JlYXRlQW5zd2VyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBjLmNyZWF0ZUFuc3dlcihcclxuICAgICAgICAgICAgZ290TG9jYWxEZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeydtYW5kYXRvcnknOiB7J09mZmVyVG9SZWNlaXZlQXVkaW8nOiB0cnVlLCAnT2ZmZXJUb1JlY2VpdmVWaWRlbyc6IHRydWV9fVxyXG4gICAgICAgICk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICB2YXIgZ290TG9jYWxEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChkZXNjcmlwdGlvbikge1xyXG4gICAgICAgIHBjLnNldExvY2FsRGVzY3JpcHRpb24oZGVzY3JpcHRpb24pO1xyXG4gICAgICAgIHRyYW5zcG9ydC5zZW5kTWVzc2FnZShkZXNjcmlwdGlvbik7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBnb3RJY2VDYW5kaWRhdGUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQuY2FuZGlkYXRlKSB7XHJcbiAgICAgICAgICAgIHRyYW5zcG9ydC5zZW5kTWVzc2FnZSh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2FuZGlkYXRlJyxcclxuICAgICAgICAgICAgICAgIGxhYmVsOiBldmVudC5jYW5kaWRhdGUuc2RwTUxpbmVJbmRleCxcclxuICAgICAgICAgICAgICAgIGlkOiBldmVudC5jYW5kaWRhdGUuc2RwTWlkLFxyXG4gICAgICAgICAgICAgICAgY2FuZGlkYXRlOiBldmVudC5jYW5kaWRhdGUuY2FuZGlkYXRlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGdvdFJlbW90ZVN0cmVhbSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIHJlbW90ZVZpZGVvRWxlbWVudC5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGV2ZW50LnN0cmVhbSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBtZXNzYWdlSGFuZGxlciA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XHJcbiAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ29mZmVyJykge1xyXG4gICAgICAgICAgICBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgU2Vzc2lvbkRlc2NyaXB0aW9uKG1lc3NhZ2UpKTtcclxuICAgICAgICAgICAgLy9jcmVhdGVBbnN3ZXIoKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHZhciBhY2NlcHRPZmZlciA9IGNvbmZpcm0oXCJTb21lb25lIHdhbnRzIHRvIHNwZWFrIHRvIHlvdVwiKTtcclxuICAgICAgICAgICAgaWYoYWNjZXB0T2ZmZXIpe1xyXG4gICAgICAgICAgICAgICAgY3JlYXRlQW5zd2VyKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAnYW5zd2VyJykge1xyXG4gICAgICAgICAgICBwYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgU2Vzc2lvbkRlc2NyaXB0aW9uKG1lc3NhZ2UpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAnY2FuZGlkYXRlJykge1xyXG4gICAgICAgICAgICB2YXIgY2FuZGlkYXRlID0gbmV3IEljZUNhbmRpZGF0ZSh7c2RwTUxpbmVJbmRleDogbWVzc2FnZS5sYWJlbCwgY2FuZGlkYXRlOiBtZXNzYWdlLmNhbmRpZGF0ZX0pO1xyXG4gICAgICAgICAgICBwYy5hZGRJY2VDYW5kaWRhdGUoY2FuZGlkYXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICBpbml0KCk7XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcclxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKHdlYlJUQ0NvbnRhaW5lcik7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgcmV0dXJuIHdlYlJUQztcclxuXHJcbn0odHJhbnNwb3J0KSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3ZWJSVEM7Il19
