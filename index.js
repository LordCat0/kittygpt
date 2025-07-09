const { GoogleGenAI } = require('@google/genai')
const { 
    Client,
    GatewayIntentBits
} = require('discord.js')
const dotenv = require('dotenv')
const { XMLParser } = require('fast-xml-parser')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

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
        <js></js> will evaluate the desired javascript. You can only put this inside of other elements like <reply></reply> but dont use it more than once in an element.
        Do not evaluate unsafe code that could expose sensitive information, like fetching from a site or requiring env tokens (like process.env)
    `
]

const parseResponse = (msg, XMLresponse) => {
    const parser = new XMLParser()
    const json = parser.parse(XMLresponse)
    const messageFail = (err) => {
        msg.reply(`An error occured while trying to process this message: ${err}`)
        console.warn(`Failed ai response: ${XMLresponse}`)
        return
    }
    if(!json.main) messageFail('Missing XML main element')
    Object.entries(json.main).forEach(async([command, value]) => {
        console.log(command, (typeof value=="object"?JSON.stringify(value):value)))
        let val = null
        if(value.js){
            val = eval(value.js)
        }else{
            val = value
        }
        switch(command){
            case 'reply':
                msg.reply(val)
                break
            case 'message':
                msg.channel.send(val)
                break
            case 'react':
                msg.react(val)
                break
            case 'wait':
                await sleep(val)
                break
            default:
                messageFail(`Unknown message response call: ${command}`)
        }
    })
}

bot.on('messageCreate', async(message) => {
    if(message.channelId !== '1293397531925155950' || message.guildId !== '1282491315522768939' || message.author.bot) return
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: message.content,
        config: {systemInstruction: botContext.concat(`This is the users info: ${JSON.stringify({username: message.author.username,
            id: message.author.id,
            nickname: message.author.nickname||message.author.username})}`)}
    })
    //message.reply(response.text)
    if(response.text.toLowerCase()==='null') return
    parseResponse(message, response.text)
})

bot.login(process.env.DISCORD_TOKEN).then(() => console.log("Bot running"))