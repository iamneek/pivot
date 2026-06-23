package main

import (
	"context"

	"github.com/coder/websocket"
)

type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

func (client *Client) ReadPump(ctx context.Context) {
	defer func() {
		client.hub.unregister <- client
	}()

	for {
		_, data, err := client.conn.Read(ctx)
		if err != nil {
			return
		}
		client.hub.broadcast <- Broadcast{sender: client, message: data} 
	}
}

func (client *Client) WritePump() {
	
}
