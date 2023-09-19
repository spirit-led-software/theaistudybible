#!/bin/sh

# The default execution directory of this script is the ci_scripts directory.
cd $CI_WORKSPACE/mobile # change working directory to the root of your cloned repo.

DOMAIN_PREFIX=""
DOMAIN_NAME="revelationsai.com"
# Get website url based on pr number
if [[ "$CI_PULL_REQUEST_NUMBER" != "" ]]; then
  DOMAIN_PREFIX="pr-${CI_PULL_REQUEST_NUMBER}.test."
fi

WEBSITE_URL="https://${DOMAIN_PREFIX}${DOMAIN_NAME}"
API_URL="https://api.${DOMAIN_PREFIX}${DOMAIN_NAME}"
CHAT_API_URL="https://chat.api.${DOMAIN_PREFIX}${DOMAIN_NAME}"

echo "Working with the following environment variables:"
echo "WEBSITE_URL: $WEBSITE_URL"
echo "API_URL: $API_URL"
echo "CHAT_API_URL: $CHAT_API_URL"

# Install Flutter using git.
git clone https://github.com/flutter/flutter.git --depth 1 -b stable $HOME/flutter
export PATH="$PATH:$HOME/flutter/bin"

# Run flutter doctor.
flutter doctor -v

# Clean flutter
flutter clean

# Install Flutter artifacts for iOS (--ios), or macOS (--macos) platforms.
flutter precache --ios

# Install Flutter dependencies.
flutter pub get

# Run code generation scripts.
flutter pub run build_runner build --delete-conflicting-outputs

# Execute flutter build config command.
flutter build ios --release --config-only \
  --dart-define "WEBSITE_URL=$WEBSITE_URL" \
  --dart-define "API_URL=$API_URL" \
  --dart-define "CHAT_API_URL=$CHAT_API_URL"

# Install CocoaPods using Homebrew.
HOMEBREW_NO_AUTO_UPDATE=1 # disable homebrew's automatic updates.
brew install cocoapods

# Install CocoaPods dependencies.
cd ios && pod install # run `pod install` in the `ios` directory.

exit 0
