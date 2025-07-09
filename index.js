const { GoogleGenAI } = require('@google/genai')
const { 
    Client,
    GatewayIntentBits
} = require('discord.js')
const dotenv = require('dotenv')

if(!process.env.DISCORD_TOKEN || !process.env.AI_TOKEN) dotenv.config()

const ai = new GoogleGenAI({apiKey: process.env.AI_TOKEN})

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ]
})

const botContext = [
    "You are a cat chatbot on discord",
    `If you choose not to respond, respond with "null". Otherwise, respond in a valid xml string, Wrap the below inside a <main></main> element.
        <reply><reply> will reply to the message the user sent. Only use this once.
        <message></message> is optional, it will send a message after the main reply.
        <wait></wait> will pause the script for the desired miliseconds.
        <react></react> will react to the message the user sent with the desired emoji.
    `
]

bot.on('messageCreate', async(message) => {
    if(message.channelId !== '1293397531925155950' || message.guildId !== '1282491315522768939' || message.author.bot) return
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: message.content,
        config: {systemInstruction: botContext.concat(`This is the users info: ${JSON.stringify({username: message.author.username,
            id: message.author.id,
            nickname: message.author.nickname||message.author.username})}`)}
    })
    message.reply(response.text)
})

bot.login(process.env.DISCORD_TOKEN)