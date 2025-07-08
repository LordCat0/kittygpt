const { OpenAI } = require('openai')
const { 
    Client,
    GatewayIntentBits
} = require('discord.js')
const dotenv = require('dotenv')

if(!process.env.DISCORD_TOKEN || !process.env.OPENAI_TOKEN) dotenv.config()

const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN
})

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
})

const botContext = [
    {role: "system", content: "You are a cat chatbot on discord"},
    {role: "system", content: `Respond in a valid xml string.
        <reply><reply> will reply to the message the user sent. Only use this once.
        <message></message> is optional, it will send a message after the main reply.
        <wait></wait> will pause the script for the desired miliseconds.
        <react></react> will react to the message the user sent with the desired emoji.
        `}
]

bot.on('messageCreate', (message) => {
    if(message.channelId !== '1293397531925155950' || message.guildId !== '1282491315522768939' || message.author.bot) return
    const completion = openai.chat.completions.create({
        model: "gpt-4o-mini",
        store: true,
        messages: botContext.concat([
            {role: "system", content: `This is the user data of the message: ${JSON.stringify({username: message.author.username, id: message.author.id, nickname: message.author.nickname||message.author.username})}`},
            {role: "user", content: message.content}
        ])
    })
    completion.then(result => console.log(result.choices[0].message))
})

bot.login(process.env.DISCORD_TOKEN)