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
				// close(client.send)
			}
		}
	}
}
