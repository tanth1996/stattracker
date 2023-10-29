'use strict';

import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export default function register(registrations) {
	const socket = SockJS('/players'); //WebSocketConfiguration.MATCH_ENDPOINT
	const stompClient = Stomp.over(socket);
	stompClient.connect({}, function(frame) {
		registrations.forEach(function (registration) {
			stompClient.subscribe(registration.route, registration.callback);
		});
	});
}
