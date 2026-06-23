package main

type Broadcast struct {
	message []byte
	sender  *Client
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan Broadcast
	register   chan *Client
	unregister chan *Client
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			
		case msg := <-h.broadcast:
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
	}
}
