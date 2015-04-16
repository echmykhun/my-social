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