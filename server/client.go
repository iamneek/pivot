package main

import (
	"context"
	"fmt"

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
		fmt.Println("Receiving strokes...")
	}
}

func (client *Client) WritePump(ctx context.Context) {
	for data := range client.send {
		err := client.conn.Write(ctx, websocket.MessageText, data)
		if err != nil {
			return
		}
	}
}
