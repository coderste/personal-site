package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello, to the backend!"))
	})

	log.Println("Starting server on :9000")
	err := http.ListenAndServe(":9000", mux)
	log.Fatal(err)
}
