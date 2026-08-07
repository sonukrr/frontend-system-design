import React from "react";
import { useState, useEffect, useRef } from "react";
import Message from "./Message";
import CommentBox from "./CommentBox"

const FIRST = [
  "Aarav",
  "Priya",
  "Rohan",
  "Ishita",
  "Kabir",
  "Meera",
  "Arjun",
  "Ananya",
  "Vikram",
  "Neha",
  "Dev",
  "Sana",
];
const LAST = [
  "Sharma",
  "Patel",
  "Reddy",
  "Nair",
  "Khan",
  "Iyer",
  "Bose",
  "Malhotra",
  "Gupta",
  "Verma",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomName = () => `${pick(FIRST)} ${pick(LAST)}`;

const makeMessage = () => {
  return {
    name: randomName(),
    message:
      "Welcome to the live stream at night. We are excited to have you here!",
    avatar:
      "https://yt4.ggpht.com/TG9W_mL0tWphBwytsUcaMNj3i5HByBFEZh94I6qbHkhpfk49yI_ACOIloejpHsK2eQqxlcl9fdc=s32-c-k-c0x00ffffff-no-rj",
    time: new Date(),
  };
};

const MAXLIMIT = 10;

const ChatStream = () => {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    scrollRef?.current?.scrollIntoView({ behaviour: "smooth" });
  }, [messages]);

  const fetchChats = () => {
    setMessages((older) => {
      const newMessages = [...older, makeMessage()];
      newMessages.splice(0, newMessages.length - MAXLIMIT);

      return newMessages;
    });
  };

  const addComment = (text) => {
    setMessages((older) => {
        let newMessage = makeMessage();
        newMessage.message = text;

        let msgs = [...older, newMessage];
        msgs.splice(0, msgs.length - MAXLIMIT);
        return msgs;
    })
  }

  return (
    <div className="border-1 h-[500px] overflow-y-auto flex flex-col w-100 ms-2 rounded-sm p-3">
      {messages.map((message, idx) => {
        return <Message id={idx} {...message} />;
      })}
      <div ref={scrollRef} />

      <CommentBox addComment={addComment}/>
    </div>
  );
};

export default ChatStream;
