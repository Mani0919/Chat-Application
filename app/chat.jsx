import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import io from "socket.io-client";

const socket = io("http://192.168.0.104:3000");

const ChatScreen = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const router = useRouter();
  const { contactName, userName } = useLocalSearchParams();

  useEffect(() => {
    socket.emit("userJoined", userName);

    socket.on("loadMessages", (pastMessages) => {
      setMessages(pastMessages);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on("userOnline", ({ userName }) => {
      setOnlineUsers((prev) => [...prev, userName]);
    });

    socket.on("userOffline", ({ userName }) => {
      setOnlineUsers((prev) => prev.filter((user) => user !== userName));
    });

    socket.emit("getChatHistory", { sender: userName, receiver: contactName });

    return () => {
      socket.off("loadMessages");
      socket.off("receiveMessage");
      socket.off("userOnline");
      socket.off("userOffline");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", {
        sender: userName,
        receiver: contactName,
        message,
      });
      setMessage("");
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === userName ? styles.sent : styles.received,
      ]}
    >
      <Text style={styles.messageText}>{item.message}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>
        {contactName}{" "}
        {onlineUsers.includes(contactName) ? "🟢 Online" : "🔴 Offline"}
      </Text>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        style={styles.messagesList}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          style={styles.messageInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { fontSize: 18, fontWeight: "bold", padding: 15, textAlign: "center" },
  messagesList: { flex: 1, padding: 15 },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: "70%",
  },
  sent: { alignSelf: "flex-end", backgroundColor: "#4a90e2" },
  received: { alignSelf: "flex-start", backgroundColor: "#ddd" },
  messageText: { color: "white", fontSize: 16 },
  inputContainer: {
    padding: 15,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 10,
  },
  sendButton: {
    backgroundColor: "#4a90e2",
    padding: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  buttonText: { color: "white", fontWeight: "bold" },
});

export default ChatScreen;
