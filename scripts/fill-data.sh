#!/bin/bash
# fill-data.sh - Copy benchmark data from CROSSHAIR project

CROSSHAIR_DIR="/Users/bill/CROSSHAIR"
SITE_DIR="/Users/bill/SITE_crosshair"

# Copy CSV
cp "$CROSSHAIR_DIR/results/benchmark-runs.csv" "$SITE_DIR/public/benchmark-runs.csv"
echo "Copied benchmark-runs.csv"

# Copy responses
rm -rf "$SITE_DIR/public/responses"
cp -r "$CROSSHAIR_DIR/results/responses" "$SITE_DIR/public/responses"
echo "Copied responses/"

# Copy images
rm -rf "$SITE_DIR/public/images"
cp -r "$CROSSHAIR_DIR/images/aerial" "$SITE_DIR/public/images"
echo "Copied images/"

echo "Done!"
