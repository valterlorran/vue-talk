module.exports = {
	props:['room-name'],
	data:function(){
		return {
			socket_events:{
				sendMessage:'sendMessage',
				startTyping:'startTyping',
				stopTyping:'stopTyping',
				userDisconnect:'userDisconnect',
				userJoinedRoom:'userJoinedRoom',
				userSentMessage:'userSentMessage',
				userStartedTyping:'userStartedTyping',
				userStoppedTyping:'userStoppedTyping',
				disconnect:'disconnect',
				connect:'connect',
				register:'register'
			},
			configs:{
				title:'Chat',
				inputPlaceholder: 'Type a message...',
				endPointFetchUsers: false,
				driverFetchUsers:false,
				driverFetchUsersSuccess:false,
				button_text:'Users',
				button_chat:'Chat',
				users_tab_text:'Users'
			},
			socket:null,
			users_typing:[],
			users:{},
			messages:[],
			message:'',
			connected:false,
			user:{},
			users_ids_to_get:[],
			tabUsers:false,
			scroll_following:true,
			chat_element:null,
			scroller_element:null
		}
	},
	computed: {
		VTUsers:function(){
			return this.users;
		}
	},
	mounted:function(){
		Vue.VueTalk.bus.$on('vue-talk-room-'+this.roomName, this.start);
	},
	methods: {
		/*---------------------------------------------------------*
		 * This event is fired when starts the component           *
		 *---------------------------------------------------------*/
		start:function(data){
			var configs = data.configs || {};
			this.fn_driverFetchUsers = configs.driverFetchUsers || this.fn_driverFetchUsers;
			this.fn_driverFetchUsersSuccess = configs.driverFetchUsersSuccess || this.fn_driverFetchUsersSuccess;
			this.configs.title = configs.title || this.configs.title;
			this.configs.button_text = configs.button_text || this.configs.button_text;
			this.configs.button_chat = configs.button_chat || this.configs.button_chat;
			this.configs.users_tab_text = configs.users_tab_text || this.configs.users_tab_text;
			this.configs.endPointFetchUsers = configs.endPointFetchUsers || this.configs.endPointFetchUsers;

			if(!this.configs.endPointFetchUsers){
				console.warn('[Vue-Talk] You didn\'t set the endPointFetchUsers. It will probably throw an error when it need to access some user\'s data.');
			}

			this.configs.inputPlaceholder = configs.inputPlaceholder || this.configs.inputPlaceholder;

			for(var i in configs.events_names){
				if(typeof this.events_names[i] != 'undefined'){
					this.events_names[i] = configs.events_names[i];
				}
			}
			this.chat_element = document.getElementById('chat-room-'+this.roomName);
			this.scroller_element = document.querySelector('#chat-room-'+this.roomName+' .wb-chat-scroll-controller');
			this.setUser(data.user);
			this.socketMount(data.socket);
			this.user.online = true;
			this.users[this.getUserKey(this.user.id)] = this.user;

		},
		/*---------------------------------------------------------*
		 * Event fired when scrolls the chat                       *
		 *---------------------------------------------------------*/
		onScroll:function(e, position){
			if(this.scroller_element){
				var scroll_max = this.scroller_element.scrollHeight - this.scroller_element.offsetHeight;
				this.scroll_following = this.scroller_element.scrollTop >= (scroll_max - 40);
			}
		},
		/*---------------------------------------------------------*
		 * Sets a custom title for the current chat                *
		 *---------------------------------------------------------*/
		setTitle:function(title){
			this.configs.title = title;
		},
		/*---------------------------------------------------------*
		 * Sets the current user                                   *
		 *---------------------------------------------------------*/
		setUser:function(user){
			this.user = user;
		},
		setOldMessages:function(messages){
			if(messages.length == 0){
				this.show_load_old_messages = false;
			}

			for(var i in messages){
				var message = messages[i];
				if(typeof message != 'object'){
					continue;
				}
				this.prependMessage(message);
			}
		},
		/*---------------------------------------------------------*
		 * Appends a message to the messages array                 *
		 *---------------------------------------------------------*/
		appendMessage:function(message){
			this.fetchUserDataIfNotExists(message.user_id);
			this.messages.push(message);
			if(this.scroll_following){
				setTimeout(this.scrollToBottom, 200);
			}
		},
		/*---------------------------------------------------------*
		 * Prenpends a message to the messages array               *
		 *---------------------------------------------------------*/
		prependMessage:function(message){
			this.fetchUserDataIfNotExists(message.user_id);
			this.messages.unshift(message);
		},
		/*---------------------------------------------------------*
		 * Scrolls the chat to bottom                              *
		 *---------------------------------------------------------*/
		scrollToBottom:function(){
			this.scroller_element.scrollTop = this.scroller_element.scrollHeight;
		},
		/*---------------------------------------------------------*
		 * Event handler fired when the current user press enter in*
		 * in the textarea.                                        *
		 *---------------------------------------------------------*/
		sendMessage:function(){
			if(!this.message.trim()){
				return;
			}
			this.appendMessage({
				message:this.message.trim(),
				user_id:this.user.id
			})

			this.emitSendMessage(this.message);

			this.message = '';
		},
		/*---------------------------------------------------------*
		 * Emits the message to the current room                   *
		 *---------------------------------------------------------*/
		emitSendMessage:function(message){
			this.socket.emit(this.socket_events.sendMessage, {message:message});
		},
		/*---------------------------------------------------------*
		 * Register the all events in the socket                   *
		 *---------------------------------------------------------*/
		socketMount:function(socket){
			this.socket = socket;
			this.socket.emit('register', {
				room:this.roomName,
				user:this.user
			});

			this.socket.on(this.socket_events.userDisconnect, this.userDisconnect);
			this.socket.on(this.socket_events.userJoinedRoom, this.userJoinedRoom);
			this.socket.on(this.socket_events.userSentMessage, this.userSentMessage);
			this.socket.on(this.socket_events.userStartedTyping, this.userStartedTyping);
			this.socket.on(this.socket_events.userStoppedTyping, this.userStoppedTyping);
			this.socket.on(this.socket_events.disconnect, this.onDisconnect);
			this.socket.on(this.socket_events.connect, this.onConnect);
		},
		/*---------------------------------------------------------*
		 * Event fired when an user disconnects or leaves the chat *
		 * data = {id: Int, name:String, img:String}               *
		 *---------------------------------------------------------*/
		userDisconnect:function(data){
			if(typeof this.users[this.getUserKey(data.id)] != 'undefined'){
				this.users[this.getUserKey(data.id)].online = false;
			}
		},
		/*---------------------------------------------------------*
		 * Event fired when an user joins the current room         *
		 * data = {id: Int, name:String, img:String}               *
		 *---------------------------------------------------------*/
		userJoinedRoom:function(data){
			this.users[this.getUserKey(data.id)] = data;
			this.users[this.getUserKey(data.id)].online = true;
		},
		/*---------------------------------------------------------*
		 * This event is fired when someone sends a message        *
		 * data = {user_id: Int, message:String}                   *
		 *---------------------------------------------------------*/
		userSentMessage:function(data){
			this.appendMessage(data);
		},
		/*---------------------------------------------------------*
		 * This event is fired when a user start typing            *
		 * data = {user_id: Int}                                   *
		 *---------------------------------------------------------*/
		userStartedTyping:function(data){
			if(this.users_typing.indexOf(data.user_id) === -1){
				this.users_typing.push(data.user_id);
			}
		},
		/*---------------------------------------------------------*
		 * This event is fired when a user stop typing             *
		 * data = {user_id: Int}                                   *
		 *---------------------------------------------------------*/
		userStoppedTyping:function(data){
			var index = this.users_typing.indexOf(data.user_id);
			if(index !== -1){
				this.users_typing.splice(index, 1);
			}
		},
		/*---------------------------------------------------------*
		 * Event fired when the current user connects              *
		 *---------------------------------------------------------*/
		onConnect:function(){
			this.connected = true;
		},
		/*---------------------------------------------------------*
		 * Event fired when the current user dsiconnects           *
		 *---------------------------------------------------------*/
		onDisconnect:function(){
			this.connected = false;
		},
		/*---------------------------------------------------------*
		 * Gets the key that is used in the users object           *
		 *---------------------------------------------------------*/
		getUserKey:function(id){
			return id;
		},
		/*---------------------------------------------------------*
		 * Starts a call in the server to get information of the   *
		 * users                                                   *
		 *---------------------------------------------------------*/
		getUsers:function(raw_ids){
			var ids = [];
			for(var i in raw_ids){
				var raw_id = parseInt(raw_ids[i]);
				if(ids.indexOf(raw_id) == -1){
					ids.push(raw_id);
				}
			}
			var users = this.users;
			var ids_filtered = [];
			for(var i in ids){
				var aux_name = this.getUserKey(ids[i]);
				if(typeof users[aux_name] == 'undefined'){
					ids_filtered.push(ids[i]);
				}
			}
			if(ids_filtered.length == 0){
				return;
			}

			this.fn_driverFetchUsers(ids_filtered, this.fn_aux_driverFetchUsersSuccess);
		},
		/*---------------------------------------------------------*
		 * Driver that to request the server and fetch users       *
		 *---------------------------------------------------------*/
		fn_driverFetchUsers:function(ids, driverFetchUsersSuccess){
			Vue.http.get(this.configs.endPointFetchUsers + '?' + this.serialize({ids:ids}))
				.then(driverFetchUsersSuccess);
		},
		/*---------------------------------------------------------*
		 * Helper to execute the success of the request            *
		 *---------------------------------------------------------*/
		fn_aux_driverFetchUsersSuccess:function(response){
			var users = this.fn_driverFetchUsersSuccess(response);
			this.setByRequestDriverUsers(users);
		},
		/*---------------------------------------------------------*
		 * Driver that filters the user                            *
		 *---------------------------------------------------------*/
		fn_driverFetchUsersSuccess:function(response){
			return response.data;
		},
		/*---------------------------------------------------------*
		 * Called when the users info request is done              *
		 *---------------------------------------------------------*/
		setByRequestDriverUsers:function(users){
			var new_users = {};
			for(var i in users){
				var user = users[i];
				var aux_name = this.getUserKey(user.id);
				new_users[aux_name] = user;
			}
			this.users = Object.assign({}, this.users, new_users)
		},
		runTimeoutGetUsers:function(){
			var ids = this.users_ids_to_get;
			this.users_ids_to_get = [];
			this.getUsers(ids)
		},
		/*---------------------------------------------------------*
		 * Fetchs users in the server side if the user do not exist*
		 *---------------------------------------------------------*/
		fetchUserDataIfNotExists:function(id){
			if(typeof this.users[this.getUserKey(id)] == "undefined"){
				this.users_ids_to_get.push(id);
				clearTimeout(this.timeoutGetUsers);
				this.timeoutGetUsers = setTimeout(this.runTimeoutGetUsers, 200);
			}
		},
		showUsersTab:function(){

		},
		/*---------------------------------------------------------*
		 * Convert a object to url parameters                      *
		 *---------------------------------------------------------*/
		serialize:function(obj){
			var str = [];
			for(var p in obj){
				if (obj.hasOwnProperty(p)) {
					str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				}
			}
			return str.join("&");
		}
	}
};