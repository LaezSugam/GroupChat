$(document).ready(function (){
	// this triggers the connection event in our server!
	var socket  = io.connect();
	// we'll write all the socket stuff after the above line!
	var name = prompt("Please enter your name");

	if(name != null){
		socket.emit("new_user", {user: name})
	}

	$("#button").click(function (){
		socket.emit('button_clicked');
	});

	$("#reset").click(function (){
		socket.emit('reset_clicked');
	});

	$("#chat_form").submit(function(event){
		socket.emit("chat_submitted", {chat: $("#chat_text").val()})
		$("#chat_text").val("")
		event.preventDefault();
	})

	socket.on('server_response', function (data){
		$("#clicks").text("The button has been pushed " + data.clicks + " time(s).")
	});

	socket.on("new_user", function(data){
		$("#friend_window").prepend("<p>" + data.user + "</p>")
	})

	socket.on("logged_in", function(data){
		for(var key in data.users){
			$("#friend_window").prepend("<p>" + data.users[key] + "</p>")
		}
	})

	socket.on("chat_submitted", function(data){
		var chatwin = $("#chat_window");
		chatwin.append("<p><strong>" + data.user + ":</strong> " + data.chat + "</p>")
		chatwin.animate({scrollTop: chatwin.prop("scrollHeight") - chatwin.height()}, 100)
	})

	socket.on("disconnect", function(data){
		$("#friend_window p").filter(function(){return $.text([this]) === data.user;}).remove();
	})

	socket.on("in_use", function(){
		name = prompt("That name is currently in use, please try another:");
		socket.emit("new_user", {user: name})
	})
})
