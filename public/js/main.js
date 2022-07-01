const roomForm = document.querySelector('#room-form')
const messageInput = document.querySelector('#message-input')
const roomMessages = document.querySelector('.room-messages')
const roomName = document.querySelector('#room-name')
const userList = document.querySelector('#users')

//Get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

const socket = io()

// Join chatroom
socket.emit('joinRoom', { username, room })

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room)
    outputUsers(users)
})

// Message from server
socket.on('message',(message) => {
    console.log(message)
    outputMessage(message)

    // Scroll down
    roomMessages.scrollTop = roomMessages.scrollHeight;
})

// Message submit
roomForm.addEventListener('submit', (e) => {
    e.preventDefault()

    let msg = messageInput.value

    // Emit message to server
    socket.emit('roomMessage', msg)

    // Clear input
    messageInput.value = ''
    messageInput.focus()
});

// Output message to DOM
const outputMessage = (message) => {
    const div = document.createElement('div')
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span> ${message.time} </span></p>
    <p class="text">
       ${message.text}
    </p>`
    document.querySelector('.room-messages').appendChild(div)
}

// Add room name to DOM
const outputRoomName = (room) => {
    roomName.innerText = room
}

// Add users to DOM
const outputUsers = (users) => {
    userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
    `
}