#!/bin/bash
# Archive into an isolated build directory, then reject missing/mismatched symbols.
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE_PATH="${1:-$PROJECT_ROOT/ios/build/RewardsPlanners-6.1-2.xcarchive}"
if [[ -e "$ARCHIVE_PATH" ]]; then
  echo "Archive already exists; choose a new output path: $ARCHIVE_PATH" >&2
  exit 1
fi
mkdir -p "$PROJECT_ROOT/ios/build" "$(dirname "$ARCHIVE_PATH")"
DERIVED_DATA="$(mktemp -d "$PROJECT_ROOT/ios/build/archive-derived-data.XXXXXX")"
xcodebuild -workspace "$PROJECT_ROOT/ios/RewardsPlanners.xcworkspace" \
  -scheme RewardsPlanners -configuration Release -destination 'generic/platform=iOS' \
  -derivedDataPath "$DERIVED_DATA" -archivePath "$ARCHIVE_PATH" \
  ARCHS=arm64 ONLY_ACTIVE_ARCH=NO archive
python3 "$PROJECT_ROOT/scripts/ios-symbols.py" --verify "$ARCHIVE_PATH"
