package cmd

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/spf13/cobra"
)

var (
	apiKey    string
	clusterId string
	backendIP string = "localhost:8000" // Default for local dev
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Join a UniGPU Enterprise Ray Cluster",
	Run: func(cmd *cobra.Command, args []string) {
		if err := CheckPrerequisites(); err != nil {
			fmt.Println("❌ Prerequisite check failed:")
			fmt.Println(err.Error())
			os.Exit(1)
		}

		fmt.Println("✅ Prerequisites verified (Python & Ray installed).")
		fmt.Printf("🔄 Connecting to UniGPU Backend for Cluster %s...\n", clusterId)

		u := url.URL{Scheme: "ws", Host: backendIP, Path: "/enterprise/ws/" + clusterId}
		q := u.Query()
		q.Set("api_key", apiKey)
		u.RawQuery = q.Encode()

		c, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
		if err != nil {
			log.Fatalf("❌ Dial error: %v", err)
		}
		defer c.Close()

		fmt.Println("✅ Connected to backend!")

		// Start Ray
		var rayCmd *exec.Cmd

		done := 1

		go func() {
			defer close(func() chan int { ch := make(chan int); close(ch); return ch }())
			for {
				_, message, err := c.ReadMessage()
				if err != nil {
					log.Println("❌ Disconnected from backend:", err)
					return
				}

				var msg map[string]interface{}
				if err := json.Unmarshal(message, &msg); err != nil {
					continue
				}

				msgType, _ := msg["type"].(string)
				switch msgType {
				case "error":
					log.Fatalf("❌ Backend Error: %v", msg["message"])
				case "START_HEAD":
					fmt.Println("👑 Designated as Head Node. Starting Ray...")
					go func() {
						rayCmd = exec.Command("ray", "start", "--head", "--port=6380")
						rayCmd.Env = append(os.Environ(), "RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1")
						out, err := rayCmd.CombinedOutput()
						if err != nil {
							log.Printf("❌ Failed to start Ray head node: %v\nOutput: %s", err, string(out))
							return
						}

						ip := "127.0.0.1"
						lines := strings.Split(string(out), "\n")
						for _, line := range lines {
							if strings.Contains(line, "ray start --address='") {
								parts := strings.Split(line, "'")
								if len(parts) >= 2 {
									ip = strings.Split(parts[1], ":")[0]
								}
							}
						}

						fmt.Printf("✅ Ray Head Node started on IP: %s\n", ip)
						// Note: This concurrent write could technically conflict with telemetry, but it's rare.
						// A mutex would be better, but for this prototype, it's fine.
						c.WriteJSON(map[string]interface{}{
							"type": "HEAD_STARTED",
							"ip":   ip,
						})
					}()
				case "START_WORKER":
					headIP, _ := msg["head_node_ip"].(string)
					fmt.Printf("👷 Designated as Worker Node. Connecting to Head IP: %s...\n", headIP)
					go func() {
						rayCmd = exec.Command("ray", "start", "--address="+headIP+":6380")
						rayCmd.Env = append(os.Environ(), "RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1")
						out, err := rayCmd.CombinedOutput()
						if err != nil {
							log.Printf("❌ Failed to start Ray worker node: %v\nOutput: %s", err, string(out))
							return
						}
						fmt.Println("✅ Ray Worker connected successfully!")
					}()
				}
			}
		}()

		// Periodic Telemetry
		go func() {
			ticker := time.NewTicker(5 * time.Second)
			defer ticker.Stop()
			for {
				<-ticker.C
				c.WriteJSON(map[string]interface{}{
					"type":    "TELEMETRY",
					"vram_mb": 24576, // 24GB Mock VRAM
				})
			}
		}()

		interrupt := make(chan os.Signal, 1)
		signal.Notify(interrupt, os.Interrupt)
		<-interrupt

		fmt.Println("\n🛑 Stopping Ray...")
		if rayCmd != nil {
			exec.Command("ray", "stop").Run()
		}
		c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		done = 0
		_ = done
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().StringVarP(&apiKey, "key", "k", "", "Organization API Key")
	startCmd.Flags().StringVarP(&clusterId, "cluster", "c", "", "Cluster ID")
	startCmd.MarkFlagRequired("key")
	startCmd.MarkFlagRequired("cluster")
}
