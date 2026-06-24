package main

import (
	"context"
	"fmt"
	"net/http"

	"github.com/coder/websocket"
)

func main() {

	hub := NewHub()
	go hub.Run()
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		c, err := websocket.Accept(w, r, nil)
		if err != nil {
			return
		}
		defer c.CloseNow()
		client := &Client{
			hub:  hub,
			conn: c,
			send: make(chan []byte, 256),
		}
		hub.register <- client
		fmt.Println("Client connected: ", client)
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		go client.WritePump(ctx)
		client.ReadPump(ctx)
	})
	fmt.Println("Server starting on port:", 8000)
	http.ListenAndServe(":8000", nil)
	fmt.Println("Server stopped")

}
