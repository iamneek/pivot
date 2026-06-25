package main

import (
	"encoding/json"
	"fmt"
)

type Broadcast struct {
	message []byte
	sender  *Client
}

type Message struct {
	Action string `json:"Action"`
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan Broadcast
	register   chan *Client
	unregister chan *Client
	log        [][]byte
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			for _, msg := range h.log {
				client.send <- msg
			}

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				fmt.Println("Client Disconnected")
			}

		case msg := <-h.broadcast:
			var m Message
			err := json.Unmarshal(msg.message, &m)
			if err != nil {
				fmt.Println("Error parsing json data...")
			}
			if m.Action == "Clear" {
				h.log = make([][]byte, 0)
			} else {
				h.log = append(h.log, msg.message)
			}
			for client := range h.clients {
				if client == msg.sender {
					continue
				}
				client.send <- msg.message
			}
		}
	}
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan Broadcast, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		log:        make([][]byte, 0),
	}
}
