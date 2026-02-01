#!/usr/bin/env python3

import yaml
import json
import argparse
import os

def main():
    parser = argparse.ArgumentParser(
        description="Convert a YAML config to JSON"
    )
    parser.add_argument("yaml_path", help="Path to input YAML file")
    parser.add_argument("json_path", help="Path to output JSON file")

    args = parser.parse_args()

    # Resolve paths
    yaml_path = os.path.abspath(args.yaml_path)
    json_path = os.path.abspath(args.json_path)

    # Load YAML
    with open(yaml_path, "r") as f:
        config = yaml.safe_load(f)

    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, "w") as f:
        json.dump(config, f, indent=2)

    print(f"Wrote JSON to {json_path}")

if __name__ == "__main__":
    main()
