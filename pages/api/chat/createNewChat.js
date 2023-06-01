import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
    try {
        const { user } = await getSession(req, res); 
        const { message } = req.body;

        // validate message data length
        if (!message || typeof message !== "string" || message.length > 200) {
            res.status(422).json({
                message: "message is required and must be less than 200 characters"
            });

            return;
        };

        const newUserMessage = {
            role: "user",
            content: message,
        };
        const client = await clientPromise;
        const db = client.db();
        const chat  = await db.collection("chats").insertOne({
            userId: user.sub, // user.sub is the subject identifier of the user
            messages: [newUserMessage],
            title: message,
        });
        res.status(200).json({ 
            _id: chat.insertedId.toString(), 
            messages: [newUserMessage],
            title: message,
        });
    } 
    catch (e) {
        res.status(500).json({ error: "An error occured when creating a new chat" });
        console.log("ERROR OCCURED IN CREATE NEW CHAT: ", e);
    }
};