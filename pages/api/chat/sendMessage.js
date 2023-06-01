import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
    runtime: "edge",
};

export default async function handler(req) {
    try {
        const { chatId: chatIdFromParam, message } = await req.json();

        // validate message data length
        if (!message || typeof message !== "string" || message.length > 200) {
            return new Response(
                {
                    message: "message is required and must be less than 200 characters",
                },
                {
                    status: 422,
                }
            );
        };

        let chatId = chatIdFromParam;
        console.log("sendMESSAGE: ", message);

        const initialChatMessage = {
            role: "system",
            content: "Your name is LondonGPT, an incredibly intelligent and quick-thinking AI, that always replies with an enthusiastic and positive energy. You were created by Intellicon Lab. Your response must be formatted as markdown.",
        };

        let newChatId;
        let chatMessages = [];

        /////////////////////////////////////////////////
        if (chatId) {
            // add a message to an existing chat
            const response = await fetch(`${req.headers.get("origin")}/api/chat/addMessageToChat`, {
                method: "POST",
                headers: {
                    'content-type': 'application/json',
                    cookie: req.headers.get("cookie"),
                },
                body: JSON.stringify({
                    chatId,
                    role: "user",
                    content: message,
                }),
            });

            const json = await response.json();
            chatMessages = json.chat.messages || [];

        }
        /////////////////////////////////////////////////
        else {
            const response = await fetch(`${req.headers.get("origin")}/api/chat/createNewChat`, {
                method: "POST",
                headers: {
                'content-type': 'application/json',
                cookie: req.headers.get("cookie"),
                },
                body: JSON.stringify({ 
                message, // message: messageText,
                }),
            });
            const json = await response.json();
            chatId = json._id;
            newChatId = json._id;

            chatMessages = json.messages || [];
        }

        const messagesToInclude = [];
        chatMessages.reverse(); // latest to oldest messages
        let usedTokens = 0;
        const MAXIMUM_TOKENS_FOR_CONVERSATION_HISTORY = 2000;
        //////////////////////////////////////////////////////////
        for (let chatMessage of chatMessages) {
            const messageTokens = chatMessage.content.length / 4;
            usedTokens += messageTokens;
            if (usedTokens <= MAXIMUM_TOKENS_FOR_CONVERSATION_HISTORY) {
                messagesToInclude.push(chatMessage);
            }
            else {
                break;
            } 
        };
        //////////////////////////////////////////////////////////

        messagesToInclude.reverse(); // oldest to latest messages

        const stream = await OpenAIEdgeStream(
            "https://api.openai.com/v1/chat/completions", 
            {
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                method: 'POST',
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [initialChatMessage, ...messagesToInclude], //  { content: message, role: 'user' }
                    stream: true,
                }),
            },
            {
                onBeforeStream: ({ emit }) => {
                    if (newChatId) {
                        emit(newChatId, "newChatId"); // "newChatId": an event ID
                    }
                },
                onAfterStream: async ({ emit, fullContent }) => { // emit will allow us to emit one last message to the client and stream one last chunk of data to the client after the stream is finished / full content is just the full content of that stream.
                    await fetch(`${req.headers.get("origin")}/api/chat/addMessageToChat`, {
                        method: "POST",
                        headers: {
                            'content-type': 'application/json',
                            cookie: req.headers.get("cookie"),
                        },
                        body: JSON.stringify({
                            chatId,
                            role: "assistant",
                            content: fullContent,
                        }),
                    });
                },
            },
        );

        return new Response(stream);
    } 
    catch (e) {
        // console.log("AN ERROR OCCURED IN SENDMESSAGE: ", e);
        return new Response(
            { message: "An error occurred in sendMessage" },
            {
              status: 500,
            }
        );
    }
}