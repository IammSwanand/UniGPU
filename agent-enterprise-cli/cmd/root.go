package cmd

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "unigpu-enterprise-cli",
	Short: "UniGPU Enterprise CLI for Ray Node Orchestration",
	Long:  `The UniGPU Enterprise CLI allows you to connect compute nodes (laptops/servers) to your UniGPU Enterprise Clusters.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func CheckPrerequisites() error {
	// Check if Python is installed
	_, err := exec.LookPath("python")
	if err != nil {
		_, err = exec.LookPath("python3")
		if err != nil {
			return fmt.Errorf("Python is not installed. Please install Python to continue.")
		}
	}

	// Check if Ray is installed
	_, err = exec.LookPath("ray")
	if err != nil {
		return fmt.Errorf("Ray is not installed. Please install ray by running: pip install -U ray")
	}

	return nil
}
