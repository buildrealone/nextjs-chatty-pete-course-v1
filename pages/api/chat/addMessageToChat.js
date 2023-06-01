import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
    try {
        const { user } = await getSession(req, res);
        const client = await clientPromise;
        const db = client.db();   

        const { chatId, role, content } = req.body;

        let objectId;

        try {
            objectId = new ObjectId(chatId);
        } 
        catch (e) {
            res.status(422).json({
                message: "Invalid chat ID",
            });
            return;
        }

        // validate content data
        if (!content || typeof content !== "string" || (role === "user" && content.length > 200)) { ////////////////////
            console.log("ROLE: ", role); ////////////////////
            console.log("CONTENT LENGTH: ", content.length); ////////////////////

            res.status(422).json({
                message: "content is required and must be less than 200 characters if user"
            });
            
            return;
        };

        // validate role
        if (role !== "user" && role !== "assistant") {
            res.status(422).json({
                message: "role must be either 'user' or 'assistant'",
            });
             
            return;
        };

        const chat = await db.collection("chats").findOneAndUpdate({
                _id: objectId, // new ObjectId(chatId),
                userId: user.sub, // ensure that users can only update chats that belong to them
            }, 
            {
                $push: {
                    messages: {
                        role,
                        content,
                    }
                }
            }, 
            {
                returnDocument: "after", // return the updated document
            }
        );
        // console.log("chat: ", chat);
        
        res.status(200).json({
            chat: {
                ...chat.value, // value: properties of "chat"
                _id: chat.value._id.toString(),
            },
        });
    }
    catch (e) {
        res.status(500).json({
            message: "An error occured when adding a message to a chat",
        });
    }
}