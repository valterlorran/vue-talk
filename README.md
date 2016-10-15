# vue-talk
## You should use vue-talk with [socketio-chat](https://github.com/valterlorran/socketio-chat)
### Installation
```
$ npm install vue-talk --save
```
### Setup
Include vue-talk in your project and register the plugin.

```js
var Vue = require('vue');
var VueTalk = require('vue-talk');
Vue.use(VueTalk);
```

### Usage

Add the component where you want to display the chat.

```html
<vue-talk room-name="room-test"></vue-talk>
```

Starts the the chat using the following code

```js
/* ... */
    mounted:function(){
        var socket = io.connect();
        var user = {
            id:1,
            name:'Valter Lorran',
            img:'profile.jpg'
        };
        var configs = {
            title: 'Chat Title',
            inputPlaceholder: 'Type a message...',
            endPointFetchUsers: 'http://mysite.com/getusers'
        };
        Vue.VueTalk.startChat('room-test', socket, user, configs);
    }
/* ... */
```


### Template
Default template:

```html
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
</div>
```
**Custom Template**

You can pass in the config the new texts for:

| Name | Description |
| --- | --- |
| title | Chat title |
| button_text | Text for the button to show the users |
| users_tab_text | Title in users tab |
| button_chat | Text in the button to show the chat |
| inputPlaceholder | Placeholder to use in the chat |

You can edit it as you like, but you should use the following objects and events:

| Name | Description |
| --- | --- |
| configs.title | Chat title |
| configs.button_text | Text for the button to show the users |
| configs.users_tab_text | Title in users tab |
| configs.button_chat | Text in the button to show the chat |
| configs.inputPlaceholder | Placeholder to use in the chat |
| message | Model that holds the message that the user is typing |
| messages | Array of messages stored in the component |
| VTUsers | Object that contains all the users and its data(id, img, name) |
| sendMessage | Function that tries to send a message using the **message** model |

### End-Point Fetch Users
You need to tell which url the plugin should fetch users data. This is important beacause sometimes the users may not be connected and we need fetch the data of these users.

**Request Driver**
By default, is used **Vue.http** to request the url:

```js
Vue.http.get
```

If you want use another driver to request the url you can set in a new function in the config variable:

```js
var configs = {
    /* ... */
    driverFetchUsers: function(ids, driverFetchUsersSuccess){
        $.get('http://mysite.com/getusers?ids='+encodeURIComponent(ids))
            .success(driverFetchUsersSuccess);
    }
    /* ... */
};
```

**Notice:** if you change the request driver you'll probably need to to change the Request Response Driver(see next). The default driver expects a response simlar to:

```js
var response = {
    /* ... */
    data:[ /* users array */ ]
}
driverFetchUsersSuccess(response);
``` 

**Notice:** the success *driverFetchUsersSuccess* must be called and receive an array of users object.

**Success Callback Driver**
You can set your own success function to set the user in the component. The function must return a array of users.

```js
var configs = {
    /* ... */
    driverFetchUsersSuccess: function(response){
        return response.users;
    }
    /* ... */
};
```

**Setting URL**
Using the config parameter you just need to tell the full path to the end-point.

```js
var configs = {
    /* ... */
    endPointFetchUsers: 'http://mysite.com/getusers'
    /* ... */
};
```

This end point will receive an array of ids(example in php):
```php
//http://mysite.com/getusers?ids=[1,2,3,4]
$ids = $_GET['ids'];
//selects the user in the database for example and returns
$users = $mysql->select('id, name, img')->from('users')->where('id in ('.join($ids,',').')');
return $users;
```
The expected response is something like:
```json
[
 {
    "id":1,
    "name":"Valter Lorran",
    "img":"profile.jpg"
 },
 {
    "id":2,
    "name":"Vera Silviane",
    "img":"profile.jpg"
 },
 /* ... */
]
```

### Events received from socket.io

| Event | Description |
| --- | --- |
| userDisconnect | This event is fired when an user in the room lose your connection or disconnects |
| userJoinedRoom | This event is fired when an user joins the room |
| userSentMessage | This event is fired when an user sends a message |
| userStartedTyping | This event is fired when an user starts typing |
| userStoppedTyping | This event is fired when an user stops typing |
| disconnect | This event is fired when the **current user** is disconnected |
| connect | This event is fired when the **current user** is connected |

### Event that the current user fires to socket.io

| Event | Description |
| --- | --- |
| sendMessage | The current user fire this event when press enter in the textarea. |
| startTyping | The current user fire this event when he presses any key in the textarea. |
| stopTyping | The current user fire this event when 15 seconds passes after he last press any key in the textarea. |
| register | The current user fire this when the component is started to register the current user in the room |

### Event Personalization

You may change the name of some events to better fit your purpose. Using the config variable:
```js
var config = {
    /* ... */
    events_names:{
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
    }
}
```

