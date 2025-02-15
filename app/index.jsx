import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import io from "socket.io-client";

const socket = io("http://192.168.29.143:3000");

const ChatScreen = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState("");
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  const handleJoinChat = () => {
    if (userName.trim()) {
      socket.connect();
      setShowModal(false);
      socket.emit("userJoined", userName);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      const messageWithUser = `${userName}: ${message}`;
      socket.emit("sendMessage", messageWithUser);
      setMessage("");
    }
  };

  const leaveChat = () => {
    socket.emit("userLeft", userName);
    socket.disconnect();
    setShowModal(true);
    setMessages([]);
    // alert(`${userName} left the chat`);
  };
  useEffect(() => {
    socket.on("userleft", (data) => {
        alert(data.message); // Show an alert when a user leaves
    });

    return () => {
        socket.off("userleft");
    };
}, []);

  const renderMessage = ({ item }) => {
    {
      console.log("878",item);
    }
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{item}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Name</Text>
            <TextInput
              value={userName}
              onChangeText={setUserName}
              placeholder="Your name..."
              style={styles.nameInput}
              autoFocus
            />
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleJoinChat}
              disabled={!userName.trim()}
            >
              <Text style={styles.joinButtonText}>Join Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.headerText}>Chat Room</Text>
        <Text style={styles.userText}>Welcome, {userName}</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
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
          multiline
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveButton} onPress={leaveChat}>
            <Text style={styles.buttonText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 15,
    backgroundColor: "#4a90e2",
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  userText: {
    color: "white",
    marginTop: 5,
  },
  messagesList: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    padding: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  messageInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sendButton: {
    backgroundColor: "#4a90e2",
    padding: 12,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  leaveButton: {
    backgroundColor: "#e74c3c",
    padding: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: "#4a90e2",
    padding: 12,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  joinButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ChatScreen;
