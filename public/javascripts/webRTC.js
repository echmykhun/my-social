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