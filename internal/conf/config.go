package conf

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/bestruirui/prism/internal/utils/log"
	"github.com/spf13/viper"
)

type Server struct {
	Host string `mapstructure:"host"`
	Port int    `mapstructure:"port"`
}

type Log struct {
	Level string `mapstructure:"level"`
}

type Database struct {
	Type string `mapstructure:"type"`
	Path string `mapstructure:"path"`
}

type Config struct {
	Server   Server   `mapstructure:"server"`
	Log      Log      `mapstructure:"log"`
	Database Database `mapstructure:"database"`
}

var AppConfig Config

func Load(path string) error {
	// Get data directory from environment variable (set by Tauri)
	dataDir := os.Getenv("PRISM_DATA_DIR")
	if dataDir == "" {
		dataDir = "data" // fallback to relative path for non-Tauri environments
	}

	if path != "" {
		viper.SetConfigFile(path)
	} else {
		viper.SetConfigName("config")
		viper.SetConfigType("json")
		viper.AddConfigPath(dataDir)
	}

	viper.AutomaticEnv()
	viper.SetEnvPrefix(APP_NAME)
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	setDefaults(dataDir)

	if err := viper.ReadInConfig(); err == nil {
		log.Infof("Using config file: %s", viper.ConfigFileUsed())
	} else {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Infof("Config file not found, creating default config in: %s", dataDir)
			if err := os.MkdirAll(dataDir, 0755); err != nil {
				log.Errorf("Failed to create data directory: %v", err)
				return fmt.Errorf("failed to create data directory: %w", err)
			}
			configPath := filepath.Join(dataDir, "config.json")
			if err := viper.SafeWriteConfigAs(configPath); err != nil {
				log.Errorf("Failed to create default config: %v", err)
				return fmt.Errorf("failed to create default config: %w", err)
			}
			log.Infof("Created default config at: %s", configPath)
		} else {
			return fmt.Errorf("error reading config file: %w", err)
		}
	}

	if err := viper.Unmarshal(&AppConfig); err != nil {
		return fmt.Errorf("unable to decode config into struct: %w", err)
	}
	return nil
}

func setDefaults(dataDir string) {
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("database.type", "sqlite")
	// Use absolute path for database if dataDir is absolute, otherwise relative
	dbPath := filepath.Join(dataDir, "data.db")
	viper.SetDefault("database.path", dbPath)
	viper.SetDefault("log.level", "info")
}
