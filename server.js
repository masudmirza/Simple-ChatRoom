require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const http = require('http')
const server = http.createServer(app)
const socketio = require('socket.io')
const io = new socketio.Server(server)
const exphbs = require('express-handlebars')
const moment = require('moment')

const { formatMessages } = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')

const { pool } = require('./db')

const port = 3000

// View engine setup
app.set('view engine', 'hbs');
app.engine('hbs', exphbs.engine({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, './views/layouts'),
}))

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/room', (req, res) => {
    pool.query('SELECT sender,message,time FROM messages WHERE room = $1', [req.query.room], (err, result) => {
        if (err) console.log(err)
        res.render('room', {
            data: result.rows
        })
    })
})


const chatBot = 'Chat Bot'

// Run when clients connect
io.on('connection', (socket) => {
    
    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room)

        socket.join(user.room)

    // Welcome current user
    socket.emit('message', formatMessages(chatBot, 'Welcome to my chat app'))

    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit(
        'message',
        formatMessages(chatBot, `${user.username} has joined the chat`)
    )

     // Send users and room info
     io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
        })
    })

    // Listen for roomMessage
    socket.on('roomMessage', (msg) => {
        const user = getCurrentUser(socket.id)
        const time = moment().format('h:mm a')
        pool.query(
            'INSERT INTO messages (sender,room,message,time) VALUES($1,$2,$3,$4)',
            [ user.username, user.room, msg, time ],
            (err, result) => {
            if (err) console.log(err)
            console.log(result)
            }
        )

        io.to(user.room).emit('message', formatMessages(user.username, msg))
    })

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)

        if (user) {
            io.to(user.room).emit(
              'message',
               formatMessages(chatBot, `${user.username} user has left the chat`)
            )

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
            })
        }
    })
})

server.listen(port, () => console.log(`Server is listening on ${port}`))