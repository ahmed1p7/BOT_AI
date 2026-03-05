# Advanced WhatsApp Bot

An advanced, multi-functional WhatsApp bot that runs on Vercel. This bot offers enhanced functionality compared to basic bots like GataBot-MD, with support for media downloading, AI integration, and more.

## Features

- ✅ Multi-device support using Baileys
- ✅ Runs seamlessly on Vercel
- ✅ Command-based interface
- ✅ Media downloading capabilities
- ✅ AI integration (OpenAI)
- ✅ Group management tools
- ✅ Web-based QR code display
- ✅ REST API endpoints
- ✅ Auto-reconnection
- ✅ Message storage

## Commands

### General Commands
- `!ping` - Check bot status
- `!info` - Show bot information
- `!help` - Show help message

### Media Commands
- `!yt [URL]` - Download YouTube video
- `!play [song name]` - Search and play music

### AI Commands
- `!gpt [prompt]` - Chat with AI assistant

### Group Commands
- `!groupinfo` - Get group information
- `!add [number]` - Add member to group
- `!remove [number] - Remove member from group

## Deployment

### To Vercel

1. Fork this repository
2. Create a new project on [Vercel](https://vercel.com/)
3. Import your forked repository
4. Add your environment variables in the Vercel dashboard
5. Deploy!

### Environment Variables

- `OWNER_NUMBER`: Your WhatsApp number (without +)
- `OPENAI_API_KEY`: Your OpenAI API key (optional)
- `MONGODB_URI`: MongoDB connection string (optional)
- `SESSION_NAME`: Session name for authentication data

### Local Development

```bash
npm install
npm start
```

After running, scan the QR code displayed in the terminal or visit http://localhost:3000/qrcode to get the QR code in your browser.

## API Endpoints

- `GET /` - Health check page
- `GET /qrcode` - QR code page (when needed)
- `POST /send-message` - Send a message to a WhatsApp number

## Architecture

This bot uses:
- [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Express.js](https://expressjs.com/) - Web framework
- [Vercel](https://vercel.com/) - Deployment platform
- [MongoDB](https://www.mongodb.com/) - Optional database storage

## Security

- Authentication data is stored locally in `baileys_auth_info/`
- Input validation for all commands
- Rate limiting considerations for production use

## License

MIT