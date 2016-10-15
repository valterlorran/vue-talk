var Plugin = function () {};
var component = require('../components/chat.js');
Plugin.install = function(Vue, _options){
	var options = _options || {};
	var str = options.template || `
	<div class="wb-chat" v-bind:id="'chat-room-' + roomName">
		<div class="wb-chat-header">
			{{configs.title}} <button class="wb-chat-button" v-on:click="tabUsers = true">{{configs.button_text}}</button>
		</div>
	    <div class="wb-chat-messages wb-chat-scroll-controller" v-on:scroll="onScroll">
	        <div v-for="(message, $index) in messages">
	        	<div class="wb-chat-user" v-if="(typeof messages[$index - 1] != 'undefined' && messages[$index - 1].user_id != message.user_id) || typeof messages[$index - 1] == 'undefined'">
	        		<img v-bind:src="VTUsers[message.user_id] ? VTUsers[message.user_id].img : ''" />
	        		<div>{{VTUsers[message.user_id] ? VTUsers[message.user_id].name : ''}}</div>
	        	</div>
	            <div class="wb-chat-m">{{message.message}}</div>
	        </div>
	    </div>
		<div class="wb-chat-input">
	        <textarea v-bind:placeholder="configs.inputPlaceholder" v-model="message" v-on:keyup.enter="sendMessage"></textarea>
		</div>

  		<transition name="wb-chat-tab-users">
			<div class="wb-chat-users" v-if="tabUsers">
				<div class="wb-chat-header">
					{{configs.users_tab_text}} <button class="wb-chat-button" v-on:click="tabUsers = false">{{configs.button_chat}}</button>
				</div>
				<div class="wb-chat-messages">
					<div v-for="user in VTUsers">
						<div class="wb-chat-user">
							<img v-bind:src="user.img" />
							<div>{{user.name}}</div>
							<span v-bind:class="{online:user.online}">&#9679</span>
						</div>
					</div>
				</div>
			</div>
  		</transition>
	</div>`;

	component.template = str;

	Vue.component('vue-talk', component);

	Vue.VueTalk = {};
	Vue.VueTalk.bus = new Vue();
	Vue.VueTalk.startChat = function(room, socket, user, configs){
		Vue.VueTalk.bus.$emit('vue-talk-room-'+room, {
			socket:socket,
			user:user,
			configs:configs
		});
	};
};

module.exports = Plugin;